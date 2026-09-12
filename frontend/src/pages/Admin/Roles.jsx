// Group permissions by section for the UI
const grouped = permissions.reduce((acc, perm) => {
  if (!acc[perm.section]) acc[perm.section] = [];
  acc[perm.section].push(perm);
  return acc;
}, {});

// Render
Object.entries(grouped).map(([section, perms]) => (
  <div key={section}>
    <h3 className="font-bold text-lg mb-2">{section}</h3>
    {perms.sort((a, b) => a.order - b.order).map(perm => (
      <label key={perm.key} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedPermissions.includes(perm.key)}
          onChange={() => togglePermission(perm.key)}
        />
        <span>{perm.label}</span>
        <span className="text-xs text-gray-400">{perm.key}</span>
      </label>
    ))}
  </div>
))