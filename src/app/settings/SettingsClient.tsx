"use client";

import { useState } from "react";
import { User, Lock, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SettingsClient({ user }: { user: any }) {
  const { update } = useSession();
  
  const [name, setName] = useState(user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    
    if (newPassword && newPassword !== confirmPassword) {
      return setStatus({ type: "error", message: "New passwords do not match." });
    }
    if (newPassword && newPassword.length < 6) {
      return setStatus({ type: "error", message: "New password must be at least 6 characters." });
    }
    if (newPassword && !currentPassword) {
      return setStatus({ type: "error", message: "Current password is required to change password." });
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newName: name,
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.error || "Failed to update settings" });
      } else {
        setStatus({ type: "success", message: data.message || "Settings updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // If name was changed, force a session update to reflect in UI
        if (name !== user.name) {
          update({ name });
        }
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: "error", message: "Network error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your profile and security preferences.</p>
      </div>

      {status.type && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px', borderRadius: '8px', marginBottom: '24px',
          background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: status.type === 'error' ? 'var(--danger)' : 'var(--success)'
        }}>
          {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span style={{ fontWeight: 500 }}>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Section */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <User size={18} /> Profile Information
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Email Address (Read Only)</label>
            <input 
              type="email" 
              value={user?.email || ""} 
              disabled 
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                background: 'rgba(0,0,0,0.02)', color: 'var(--text-secondary)', cursor: 'not-allowed'
              }} 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Display Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
              minLength={2}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                background: 'var(--bg-card)', color: 'var(--text-main)', transition: 'all 0.2s'
              }} 
            />
          </div>
        </div>

        {/* Security Section */}
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <Lock size={18} /> Change Password
          </h3>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Leave fields blank if you do not wish to change your password.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Current Password</label>
              <input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                placeholder="Enter current password"
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                  background: 'var(--bg-card)', color: 'var(--text-main)'
                }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  placeholder="New password (min 6 chars)"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                    background: 'var(--bg-card)', color: 'var(--text-main)'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', 
                    background: 'var(--bg-card)', color: 'var(--text-main)'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white',
              padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: '1rem', transition: 'all 0.2s', opacity: isLoading ? 0.7 : 1
            }}
          >
            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
}
