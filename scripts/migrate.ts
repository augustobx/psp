import fs from 'fs';
import path from 'path';
import { PrismaClient, BookingStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Función robusta para parsear las tuplas VALUES (...) de un SQL dump
function parseSqlValues(sqlText: string) {
    const records: string[][] = [];
    let inString = false;
    let escape = false;
    let currentRecord: string[] = [];
    let currentValue = '';
    let inTuple = false;

    for (let i = 0; i < sqlText.length; i++) {
        const char = sqlText[i];
        
        if (!inTuple) {
            if (char === '(') inTuple = true;
            continue;
        }

        if (escape) {
            currentValue += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === "'") {
            if (inString && sqlText[i+1] === "'") {
                currentValue += "'";
                i++; // saltar la segunda comilla
                continue;
            }
            inString = !inString;
            continue;
        }

        if (inString) {
            currentValue += char;
        } else {
            if (char === ',') {
                currentRecord.push(currentValue.trim());
                currentValue = '';
            } else if (char === ')') {
                currentRecord.push(currentValue.trim());
                records.push(currentRecord);
                currentRecord = [];
                currentValue = '';
                inTuple = false;
            } else {
                currentValue += char;
            }
        }
    }
    return records;
}

async function main() {
    console.log('Iniciando migración de datos...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(process.cwd(), 'dbbkpd', 'c2801249_pspv2.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('El archivo SQL no existe:', sqlPath);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Mapeos en memoria
    const oldCourtIdToNewId = new Map<string, string>();
    const userPhoneToNewId = new Map<string, string>();

    // 1. Migrar Canchas (courts)
    console.log('--- Migrando Canchas ---');
    const courtMatches = sqlContent.match(/INSERT INTO `courts`[^\n]*VALUES\s*([\s\S]*?);/);
    if (courtMatches && courtMatches[1]) {
        const courtRecords = parseSqlValues(courtMatches[1]);
        for (const record of courtRecords) {
            const oldId = record[0]; // id
            // record[1] es sport_id
            const name = record[2] || `Cancha ${oldId}`; // name (el parser remueve las comillas simples de los extremos)
            const isActiveStr = record[3]; // is_active
            
            const isActive = isActiveStr === '1';

            const newCourt = await prisma.court.create({
                data: {
                    name,
                    isActive,
                    sport: 'Padel',
                    surface: 'Piso Sintético'
                }
            });
            oldCourtIdToNewId.set(oldId, newCourt.id);
            console.log(`Cancha migrada: ${name} -> Nuevo ID: ${newCourt.id}`);
        }
    }

    // 2. Extraer y migrar Usuarios (de bookings)
    console.log('--- Extrayendo y Migrando Usuarios ---');
    const bookingMatches = sqlContent.match(/INSERT INTO `bookings`[^\n]*VALUES\s*([\s\S]*?);/);
    let bookingRecords: string[][] = [];
    if (bookingMatches && bookingMatches[1]) {
        bookingRecords = parseSqlValues(bookingMatches[1]);
        
        for (const record of bookingRecords) {
            let fullname = record[4] || 'Usuario Desconocido';
            let phone = record[5];
            
            // Limpiar teléfono
            if (phone === 'NULL' || !phone) phone = '0000000000';
            phone = phone.replace(/\D/g, ''); // Dejar solo números

            if (!userPhoneToNewId.has(phone)) {
                // Verificar si existe en DB
                let user = await prisma.user.findFirst({ where: { phone } });
                
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            name: fullname,
                            phone,
                            email: `user_${phone}@migrated.com`, // Email fake para unique constraint si no hay
                            role: 'PLAYER'
                        }
                    });
                }
                userPhoneToNewId.set(phone, user.id);
            }
        }
        console.log(`Se procesaron ${userPhoneToNewId.size} usuarios únicos.`);
    }

    // 3. Migrar Bookings
    console.log('--- Migrando Reservas (Bookings) ---');
    if (bookingRecords.length > 0) {
        let count = 0;
        for (const record of bookingRecords) {
            const oldCourtId = record[1];
            const dateStr = record[2]; // 'YYYY-MM-DD'
            const timeStr = record[3]; // 'HH:MM:SS'
            let phone = record[5];
            const statusStr = record[8]?.toLowerCase();
            const priceTotalStr = record[6];
            const depositAmountStr = record[7];
            const mpPaymentId = record[12];

            if (phone === 'NULL' || !phone) phone = '0000000000';
            phone = phone.replace(/\D/g, '');

            const courtId = oldCourtIdToNewId.get(oldCourtId);
            const userId = userPhoneToNewId.get(phone);

            if (!courtId) {
                console.warn(`[Aviso] Cancha antigua ${oldCourtId} no encontrada, omitiendo reserva.`);
                continue;
            }

            // Fechas
            const startDateTime = new Date(`${dateStr}T${timeStr}`);
            // Sumar 90 mins por defecto
            const endDateTime = new Date(startDateTime.getTime() + 90 * 60000);

            // Mapeo de estado
            let status: BookingStatus = 'PENDING';
            if (statusStr === 'confirmed' || statusStr === 'finalized') status = 'CONFIRMED';
            else if (statusStr === 'rejected') status = 'CANCELLED';

            // Monto
            let totalAmount = 0;
            if (priceTotalStr !== 'NULL' && priceTotalStr) {
                totalAmount = parseFloat(priceTotalStr);
            }

            await prisma.booking.create({
                data: {
                    courtId,
                    userId,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    status,
                    paymentId: mpPaymentId !== 'NULL' ? mpPaymentId : undefined,
                    totalAmount
                }
            });
            count++;
        }
        console.log(`Migradas ${count} reservas.`);
    }

    // 4. (Opcional) Fixed Bookings y Blackouts
    console.log('--- Migrando Blackouts a CourtBlock ---');
    const blackoutMatches = sqlContent.match(/INSERT INTO `blackouts`[^\n]*VALUES\s*([\s\S]*?);/);
    if (blackoutMatches && blackoutMatches[1]) {
        const blackoutRecords = parseSqlValues(blackoutMatches[1]);
        let bCount = 0;
        for (const record of blackoutRecords) {
            const oldCourtId = record[1];
            const startTimeStr = record[2]; // 'YYYY-MM-DD HH:MM:SS'
            const endTimeStr = record[3];
            const label = record[4];

            const courtId = oldCourtIdToNewId.get(oldCourtId);
            if (!courtId) continue;

            const startTime = new Date(startTimeStr.replace(' ', 'T'));
            const endTime = new Date(endTimeStr.replace(' ', 'T'));

            await prisma.courtBlock.create({
                data: {
                    courtId,
                    startTime,
                    endTime,
                    reason: label !== 'NULL' ? label : 'Bloqueado'
                }
            });
            bCount++;
        }
        console.log(`Migrados ${bCount} bloqueos.`);
    }

    console.log('¡Migración completada exitosamente!');
}

main()
    .catch(e => {
        console.error('Error durante la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
