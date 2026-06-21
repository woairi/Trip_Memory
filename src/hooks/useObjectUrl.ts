import { useEffect, useState } from 'react';

/**
 * Blob → object URL 변환을 관리한다.
 * blob 이 바뀌거나 언마운트될 때 이전 URL을 revoke 하여 메모리 누수를 막는다.
 */
export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}
