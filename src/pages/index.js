import {log} from '@/lib/index';
import { useEffect } from 'react';

export default function Home() {
  log.setConfig({color: 'green', level: 'debug'})
  useEffect(() => {
    console.log(log.getLevel())
    log.setLevel('debug')
    console.log(log.getLevel())
    log.setLevel('trace')
    
    log.trace(log.getLevel())
  }, [])
  return (
    <>
      Level home
    </>
  );
}
