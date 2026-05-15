'use client';

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface AdminSettings {
  siteName: string;
  maxDecisionAlternatives: number;
  maxDecisionCriteria: number;
  enableAIFeatures: boolean;
  enableUserRegistration: boolean;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  dataRetentionDays: number;
}

const DEFAULTS: AdminSettings = {
  siteName: 'DeciSmart',
  maxDecisionAlternatives: 10,
  maxDecisionCriteria: 10,
  enableAIFeatures: true,
  enableUserRegistration: true,
  emailNotifications: false,
  maintenanceMode: false,
  dataRetentionDays: 365,
};

const STORAGE_KEY = 'decismart_admin_settings';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? 'bg-blue-600' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-8">
        <p className="font-medium text-slate-800">{label}</p>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  function update<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function toggle(key: keyof AdminSettings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    if (window.confirm('Reset all settings to default values?')) {
      setSettings(DEFAULTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
      setSaved(true);
      setDirty(false);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Administration Settings"
        subtitle="Configure application behavior and features"
      />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Save banner */}
        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-800">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* General */}
        <Section title="General Settings">
          <SettingRow label="Application Name" description="Name displayed throughout the application">
            <Input
              value={settings.siteName}
              onChange={e => update('siteName', e.target.value)}
              className="w-48 h-9"
            />
          </SettingRow>
          <SettingRow label="Data Retention Period" description="How many days to keep archived data (days)">
            <Input
              type="number"
              min={30}
              max={3650}
              value={settings.dataRetentionDays}
              onChange={e => update('dataRetentionDays', parseInt(e.target.value) || 365)}
              className="w-28 h-9"
            />
          </SettingRow>
        </Section>

        {/* Feature Limits */}
        <Section title="Feature Limits">
          <SettingRow label="Max Alternatives per Decision" description="Maximum number of alternatives a user can add">
            <Input
              type="number"
              min={2}
              max={20}
              value={settings.maxDecisionAlternatives}
              onChange={e => update('maxDecisionAlternatives', parseInt(e.target.value) || 10)}
              className="w-24 h-9"
            />
          </SettingRow>
          <SettingRow label="Max Criteria per Decision" description="Maximum number of criteria a user can define">
            <Input
              type="number"
              min={1}
              max={20}
              value={settings.maxDecisionCriteria}
              onChange={e => update('maxDecisionCriteria', parseInt(e.target.value) || 10)}
              className="w-24 h-9"
            />
          </SettingRow>
        </Section>

        {/* Feature Toggles */}
        <Section title="Feature Toggles">
          <SettingRow label="Enable AI Features" description="Allow AI-powered analysis and suggestions">
            <Toggle on={settings.enableAIFeatures} onChange={() => toggle('enableAIFeatures')} />
          </SettingRow>
          <SettingRow label="User Registration" description="Allow new users to create accounts">
            <Toggle on={settings.enableUserRegistration} onChange={() => toggle('enableUserRegistration')} />
          </SettingRow>
          <SettingRow label="Email Notifications" description="Send system email notifications to users">
            <Toggle on={settings.emailNotifications} onChange={() => toggle('emailNotifications')} />
          </SettingRow>
          <SettingRow
            label="Maintenance Mode"
            description="Temporarily disable user access to the platform"
          >
            <button
              onClick={() => toggle('maintenanceMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </SettingRow>
        </Section>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 flex items-center gap-2 bg-red-100">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
          </div>
          <div className="p-6">
            <SettingRow label="Reset to Defaults" description="Restore all settings to their original default values">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-red-600 border-red-300 hover:bg-red-50 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </SettingRow>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {dirty && !saved && (
            <p className="text-sm text-amber-600 font-medium">⚠ You have unsaved changes</p>
          )}
          <div className="ml-auto">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 gap-2 px-6"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
