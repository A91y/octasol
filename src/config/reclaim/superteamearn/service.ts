import { scrapeSuperteamStats } from './scraper';

export async function processSuperteamEarnData(
  githubId: string,
  proof: any,
  providerName: string
) {
  const username = JSON.parse(proof[0].claimData.context).extractedParameters
    .username;
  console.log('Username:', username);

  const stats = await scrapeSuperteamStats(username);

  if (stats) {
    console.log('Participations:', stats.participations);
    console.log('Wins:', stats.wins);
    console.log('Total Winnings:', stats.totalWinnings);
  } else {
    console.log('Failed to fetch Superteam stats.');
  }

  const lastUpdateTimeStamp = proof[0].claimData.timestampS;
  console.log('Proof is:', proof[0]);

  return true;
}