import { getWorkplaceConfig } from '@/lib/actions';
import CompanyLocationForm from '@/components/admin/settings/company-location-form';

export default async function SettingsPage() {
    const config = await getWorkplaceConfig();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <div className="space-y-4">
                <CompanyLocationForm initialConfig={config} />
            </div>
        </div>
    );
}
