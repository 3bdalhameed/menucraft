import {getChatGPTUser} from './chatgpt-auth';
import Dashboard from '@/components/menucraft/dashboard';
import Landing from '@/app/landing/page';
export const dynamic='force-dynamic';
export default async function Home(){
  const user=await getChatGPTUser();
  if(!user)return <Landing/>;
  return <Dashboard/>;
}