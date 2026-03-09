import log from '@/lib/index';
import { useEffect } from 'react';

export default function Home() {
  log.setConfig({color: 'green', level: 'trace'})
  log.error(log.getLevel(), 'hi2')
  useEffect(() => {
    // log.setLevel('trace')
    // log.trace(log.getLevel())
  }, [])
  return (
    <>
      Level home
    </>
  );
}
