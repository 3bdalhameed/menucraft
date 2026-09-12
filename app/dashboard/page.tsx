import {requireChatGPTUser} from '@/app/chatgpt-auth';
import Dashboard from '@/components/menucraft/dashboard';

export const dynamic='force-dynamic';
export const metadata={title:'Restaurant workspace | TableMint'};
export default async function DashboardPage(){
  const user=await requireChatGPTUser('/dashboard');
  return <Dashboard user={user}/>;
}
