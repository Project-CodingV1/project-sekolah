import React, { useState } from 'react';

const Settings = () => {
  const [settings, setSettings] = useState({
    platformName: 'SekolahApp',
    defaultSchoolType: 'SD',
    autoApproveSchools: false,
    enableEmailNotifications: true,
    maintenanceMode: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save settings logic would go here
    alert('Pengaturan berhasil disimpan');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan Platform</h2>
        <p className="text-gray-600 mt-1">Konfigurasi sistem keseluruhan</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Umum</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Platform
                </label>
                <input
                  type="text"
                  name="platformName"
                  value={settings.platformName}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Sekolah Default
                </label>
                <select
                  name="defaultSchoolType"
                  value={settings.defaultSchoolType}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="TK">TK</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sistem</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Auto-approve Sekolah Baru
                  </label>
                  <p className="text-sm text-gray-500">
                    Otomatis aktifkan sekolah baru tanpa verifikasi manual
                  </p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="autoApproveSchools"
                    checked={settings.autoApproveSchools}
                    onChange={handleInputChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    id="autoApproveToggle"
                  />
                  <label
                    htmlFor="autoApproveToggle"
                    className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      settings.autoApproveSchools ? 'bg-green-500' : ''
                    }`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Notifikasi Email
                  </label>
                  <p className="text-sm text-gray-500">
                    Kirim notifikasi email untuk aktivitas penting
                  </p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="enableEmailNotifications"
                    checked={settings.enableEmailNotifications}
                    onChange={handleInputChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    id="emailToggle"
                  />
                  <label
                    htmlFor="emailToggle"
                    className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      settings.enableEmailNotifications ? 'bg-green-500' : ''
                    }`}
                  ></label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Mode Maintenance
                  </label>
                  <p className="text-sm text-gray-500">
                    Nonaktifkan akses pengguna untuk maintenance sistem
                  </p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    id="maintenanceToggle"
                  />
                  <label
                    htmlFor="maintenanceToggle"
                    className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                      settings.maintenanceMode ? 'bg-red-500' : ''
                    }`}
                  ></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setSettings({
              platformName: 'SekolahApp',
              defaultSchoolType: 'SD',
              autoApproveSchools: false,
              enableEmailNotifications: true,
              maintenanceMode: false
            })}
            className="btn-secondary"
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn-primary"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;