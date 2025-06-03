
"use client";

import { useEffect, useState } from 'react';
import { Fingerprint, Globe, Laptop, ShieldCheck } from 'lucide-react';
import { getDeviceFingerprint, type DeviceFingerprint, generateFingerprintHash } from '@/lib/fingerprint-utils';
import { getPublicIp, getPrivateIp } from '@/lib/ip-utils';
import { InfoCard } from './InfoCard';

// Helper to format keys from camelCase to Title Case
const formatKey = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

export function FortressIdDisplay() {
  const [fingerprint, setFingerprint] = useState<DeviceFingerprint | null>(null);
  const [publicIp, setPublicIp] = useState<string | null>(null);
  const [privateIp, setPrivateIp] = useState<string | null>(null);
  const [fingerprintHash, setFingerprintHash] = useState<string | null>(null);

  const [loadingFingerprint, setLoadingFingerprint] = useState(true);
  const [loadingPublicIp, setLoadingPublicIp] = useState(true);
  const [loadingPrivateIp, setLoadingPrivateIp] = useState(true);
  const [loadingHash, setLoadingHash] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Device Fingerprint and Generate Hash
      setLoadingFingerprint(true);
      setLoadingHash(true);
      const fpData = getDeviceFingerprint();
      setFingerprint(fpData);
      if (fpData) {
        const hash = generateFingerprintHash(fpData);
        setFingerprintHash(hash);
      } else {
        setFingerprintHash(null);
      }
      setLoadingFingerprint(false);
      setLoadingHash(false);

      // Fetch Public IP
      setLoadingPublicIp(true);
      const pubIp = await getPublicIp();
      setPublicIp(pubIp);
      setLoadingPublicIp(false);

      // Fetch Private IP
      setLoadingPrivateIp(true);
      const privIp = await getPrivateIp();
      setPrivateIp(privIp);
      setLoadingPrivateIp(false);
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10 font-headline text-primary">
        Fortress ID - Your Device Identification
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InfoCard title="Device Fingerprint" icon={<Fingerprint size={28} />} isLoading={loadingFingerprint}>
          {fingerprint ? (
            <ul className="space-y-2 text-sm max-h-96 overflow-y-auto">
              {Object.entries(fingerprint).map(([key, value]) => (
                <li key={key} className="break-all">
                  <span className="font-semibold text-primary-foreground bg-primary/80 px-1 rounded-sm mr-1">{formatKey(key)}:</span>
                  {value !== null && typeof value !== 'undefined' ? String(value) : 'N/A'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Unavailable</p>
          )}
        </InfoCard>

        <InfoCard title="Unique Device ID" icon={<ShieldCheck size={28} />} isLoading={loadingHash}>
          {fingerprintHash ? (
            <p className="text-xl font-mono text-accent break-all">{fingerprintHash}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loadingFingerprint || loadingHash ? 'Generating...' : 'Unavailable'}
            </p>
          )}
        </InfoCard>

        <InfoCard title="Public IP Address" icon={<Globe size={28} />} isLoading={loadingPublicIp}>
          {publicIp ? (
            <p className="text-2xl font-bold text-accent">{publicIp}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{loadingPublicIp ? 'Loading...' : 'Unavailable'}</p>
          )}
        </InfoCard>

        <InfoCard title="Private IP Address" icon={<Laptop size={28} />} isLoading={loadingPrivateIp}>
          {privateIp ? (
            <p className="text-2xl font-bold text-accent">{privateIp}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loadingPrivateIp ? 'Attempting to retrieve...' : 'Unavailable or not permitted by browser.'}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">Note: Private IP retrieval relies on browser capabilities (WebRTC) and may not always be available or accurate.</p>
        </InfoCard>
      </div>
    </div>
  );
}
