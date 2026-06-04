import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = (process.env.DATABASE_URL || '').replace('mysql://', 'mariadb://');
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

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
                i++;
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

function addMinutesToTimeStr(timeStr: string, minutesToAdd: number) {
    if (!timeStr) return "00:00";
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr || '0', 10);
    let m = parseInt(mStr || '0', 10);
    m += minutesToAdd;
    while (m >= 60) {
        h += 1;
        m -= 60;
    }
    if (h >= 24) h -= 24;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

async function main() {
    console.log('Iniciando migración de datos...');
    
    const sqlPath = path.join(process.cwd(), 'dbbkpd', 'c2801249_pspv2.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('El archivo SQL no existe en:', sqlPath);
        process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const oldCourtIdToNewId = new Map<string, string>();
    const userPhoneToNewId = new Map<string, string>();

    // 0. Mapear canchas existentes en la DB nueva
    const existingCourts = await prisma.court.findMany();
    const courtNameToNewId = new Map<string, string>();
    for (const c of existingCourts) {
        courtNameToNewId.set(c.name.trim().toLowerCase(), c.id);
    }

    // 1. Vincular Canchas (courts) antiguas a las nuevas
    console.log('--- Vinculando Canchas ---');
    const courtMatches = sqlContent.match(/INSERT INTO `courts`[^\n]*VALUES\s*([\s\S]*?);/);
    if (courtMatches && courtMatches[1]) {
        const courtRecords = parseSqlValues(courtMatches[1]);
        for (const record of courtRecords) {
            const oldId = record[0]; 
            const name = record[2] || `Cancha ${oldId}`;
            
            // Buscar la cancha existente en lugar de duplicarla
            const newId = courtNameToNewId.get(name.trim().toLowerCase());
            if (newId) {
                oldCourtIdToNewId.set(oldId, newId);
                console.log(`✅ Cancha enlazada: ${name} -> Nuevo ID: ${newId}`);
            } else {
                console.log(`⚠️ Cancha "${name}" no existe en la base nueva. Creándola sin horarios...`);
                const created = await prisma.court.create({
                    data: { name, isActive: true, sport: 'Padel', surface: 'Piso Sintético' }
                });
                oldCourtIdToNewId.set(oldId, created.id);
            }
        }
    }

    // 2. Extraer y migrar Usuarios
    console.log('--- Extrayendo y Migrando Usuarios ---');
    const bookingMatches = sqlContent.match(/INSERT INTO `bookings`[^\n]*VALUES\s*([\s\S]*?);/);
    let bookingRecords: string[][] = [];
    if (bookingMatches && bookingMatches[1]) {
        bookingRecords = parseSqlValues(bookingMatches[1]);
        let usersCreated = 0;
        for (const record of bookingRecords) {
            let fullname = record[4] || 'Usuario Desconocido';
            let phone = record[5];
            
            if (phone === 'NULL' || !phone) phone = '0000000000';
            phone = phone.replace(/\D/g, ''); 

            if (!userPhoneToNewId.has(phone)) {
                let user = await prisma.user.findFirst({ where: { phone } });
                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            name: fullname,
                            phone,
                            email: `user_${phone}_${Math.floor(Math.random() * 10000)}@migrated.com`,
                            role: 'PLAYER'
                        }
                    });
                    usersCreated++;
                }
                userPhoneToNewId.set(phone, user.id);
            }
        }
        console.log(`Se aseguraron ${userPhoneToNewId.size} usuarios (nuevos creados: ${usersCreated}).`);
    }

    // 3. Migrar Reservas
    console.log('--- Migrando Reservas (Bookings) ---');
    if (bookingRecords.length > 0) {
        let count = 0;
        for (const record of bookingRecords) {
            const oldCourtId = record[1];
            const dateStr = record[2]; 
            const timeStr = record[3]; 
            let phone = record[5];
            const statusStr = record[8]?.toLowerCase();
            const priceTotalStr = record[6];
            const mpPaymentId = record[12];

            if (phone === 'NULL' || !phone) phone = '0000000000';
            phone = phone.replace(/\D/g, '');

            const courtId = oldCourtIdToNewId.get(oldCourtId);
            const userId = userPhoneToNewId.get(phone);

            if (!courtId) continue;

            const startDateTime = new Date(`${dateStr}T${timeStr}`);
            const endDateTime = new Date(startDateTime.getTime() + 90 * 60000); // 90 min

            let status: any = 'PENDING';
            if (statusStr === 'confirmed' || statusStr === 'finalized') status = 'CONFIRMED';
            else if (statusStr === 'rejected') status = 'CANCELLED';

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
        console.log(`✅ Migradas ${count} reservas comunes.`);
    }

    // 4. Migrar Turnos Fijos
    console.log('--- Migrando Turnos Fijos ---');
    const fixedMatches = sqlContent.match(/INSERT INTO `fixed_reservations`[^\n]*VALUES\s*([\s\S]*?);/);
    if (fixedMatches && fixedMatches[1]) {
        const fixedRecords = parseSqlValues(fixedMatches[1]);
        let countFixed = 0;
        for (const record of fixedRecords) {
            const oldCourtId = record[1];
            const dowStr = record[2]; // Dia de semana
            const timeStr = record[3]; // "21:00:00"
            const fullname = record[4] || 'Fijo';
            let phone = record[5];
            const activeStr = record[6];
            
            if (phone === 'NULL' || !phone) phone = '0000000000';
            phone = phone.replace(/\D/g, '');

            const courtId = oldCourtIdToNewId.get(oldCourtId);
            if (!courtId) continue;

            // Conseguir o crear el usuario para el fijo
            let userId = userPhoneToNewId.get(phone);
            if (!userId) {
                const user = await prisma.user.create({
                    data: {
                        name: fullname,
                        phone,
                        email: `fijo_${phone}_${Math.floor(Math.random() * 10000)}@migrated.com`,
                        role: 'PLAYER'
                    }
                });
                userId = user.id;
                userPhoneToNewId.set(phone, userId);
            }

            const startTimeHHmm = timeStr.substring(0, 5); // Ej: 21:00
            const endTimeHHmm = addMinutesToTimeStr(startTimeHHmm, 90);
            
            await prisma.fixedBooking.create({
                data: {
                    courtId,
                    userId,
                    dayOfWeek: parseInt(dowStr, 10),
                    startTime: startTimeHHmm,
                    endTime: endTimeHHmm,
                    startDate: new Date(), // Desde hoy
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Hasta 1 año despues
                    isActive: activeStr === '1'
                }
            });
            countFixed++;
        }
        console.log(`✅ Migrados ${countFixed} turnos fijos.`);
    }

    console.log('¡Migración completada exitosamente sin duplicar canchas!');
}

main()
    .catch(e => { console.error('Error durante la migración:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
