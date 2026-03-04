// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {log} from '@/lib/index';
export default function handler(req, res) {
  console.log(log.getLevel())
  log.debug('Hello world')
  res.status(200).json({ name: "John Doe" });
}
