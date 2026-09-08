import {requireChatGPTUser} from './chatgpt-auth';import Dashboard from '@/components/menucraft/dashboard';
export const dynamic='force-dynamic';
export default async function Home(){await requireChatGPTUser('/');return <Dashboard/>}