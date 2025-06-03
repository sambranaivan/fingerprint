export async function getPublicIp(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) {
      console.error('Failed to fetch public IP:', response.statusText);
      return null;
    }
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error);
    return null;
  }
}

export async function getPrivateIp(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.RTCPeerConnection) {
    return null; // Not in browser or WebRTC not supported
  }

  return new Promise((resolve) => {
    let resolved = false;
    const pc = new RTCPeerConnection({ iceServers: [] });

    const resolveAndClose = (ip: string | null) => {
      if (!resolved) {
        resolved = true;
        if (pc.signalingState !== 'closed') {
          pc.close();
        }
        resolve(ip);
      }
    };

    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => resolveAndClose(null));

    pc.onicecandidate = (ice) => {
      if (resolved) return;

      if (ice && ice.candidate && ice.candidate.candidate) {
        const candidate = ice.candidate.candidate;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(candidate);

        if (match) {
          const ip = match[1];
          // Check if it's a common private IP range
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || (ip.startsWith('172.') && (parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31))) {
            // Prioritize srflx, host, or prflx candidates if available, which are more likely local IPs
            if (candidate.includes('typ srflx') || candidate.includes('typ host') || candidate.includes('typ prflx')) {
              resolveAndClose(ip);
            }
          }
        }
      } else if (!ice.candidate) {
        // All candidates gathered, try parsing from SDP as a fallback
        if (pc.localDescription && pc.localDescription.sdp) {
            const sdp = pc.localDescription.sdp;
            const sdpLines = sdp.split('\r\n');
            let foundIp: string | null = null;
            sdpLines.forEach(line => {
                if (line.startsWith('a=candidate:')) {
                    const parts = line.split(' ');
                    if (parts.length >= 5) {
                        const ip = parts[4];
                        if (ip.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/) && 
                            (ip.startsWith('192.168.') || ip.startsWith('10.') || (ip.startsWith('172.') && (parseInt(ip.split('.')[1], 10) >= 16 && parseInt(ip.split('.')[1], 10) <= 31)))) {
                           if (!foundIp) foundIp = ip; // Take the first one found in SDP
                        }
                    }
                }
            });
            if (foundIp) {
                resolveAndClose(foundIp);
                return;
            }
        }
        resolveAndClose(null); // No suitable IP found
      }
    };

    // Timeout to prevent hanging
    setTimeout(() => {
      if (!resolved) {
        resolveAndClose(null);
      }
    }, 1500); // Increased timeout slightly
  });
}
