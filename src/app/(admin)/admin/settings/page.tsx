import { getSettings } from "@/actions/settings";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Configuración del Sistema</h1>
            <SettingsForm initialSettings={settings} />
        </div>
    );
}