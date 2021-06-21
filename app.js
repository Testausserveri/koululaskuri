/* 
Testausserverin #satunnaiset-aamulaskuri.
*/

process.env.TZ = 'Europe/Helsinki'
// Set timezone for the process

const Discord = require('discord.js')

// Create WebhookClient
const webhook = new Discord.WebhookClient(process.env.WEBHOOK_ID, process.env.WEBHOOK_SECRET);

const config = require('./config.json');

const diff = (to, from = Date.now()) => {
  return Math.ceil((to.getTime() - from)/(24 * 60 * 60 * 1000))
}

const getMessage = (startDate, serveDays, msg = "") => {
  const serveTime = 24 * 60 * 60 * 1000 * serveDays;
  const trainDay = Math.ceil(serveDays / 2); // Aamujuna kääntyy
  const endDate = new Date(startDate.getTime() + serveTime);
  if(diff(startDate) > 0) {
    msg += `Palveluksen alkuun ${diff(startDate)} aamua.`
  } else if(diff(startDate) == 0) {
    msg += `TJ: Palvelus alkaa tänään. Aamukasassa ${diff(endDate)} aamua.`;
  } else if(diff(endDate) === trainDay) {
    msg += `TJ: Aamujuna kääntyy. Aamuja jäljellä ${diff(endDate)}`
  } else if (diff(endDate) > 0) {
    msg += `TJ: Aamuja jäljellä ${diff(endDate)}.`;
  } else if (diff(endDate) == 0) {
    msg += `Reservin aurinko paistaa :sun_with_face:`;
  } else {
    return ''; // Reservin aurinko paistaa!
  }
  const percentage = diff(startDate) > 0 ? 0 : ((serveDays-diff(endDate))*100)/serveDays;
  msg += `\n${percentage.toFixed(1)}% palvelusta käyty (${diff(startDate)>0?'0':serveDays-diff(endDate)} / ${serveDays})`;
  return msg;
}  

// 1 saapumiserä = embed
let embeds = {};

Object.keys(config.subscribers).forEach((entry) => {
  const startDate = new Date(config.entry[entry]);
  const days = config.subscribers[entry];
  if(
    days["347"].length === 0
    && days["255"].length === 0 
    && days["147"].length === 0
  ) {
    return;
  }
  const message347 = getMessage(startDate, 347, `${days["347"].join(' ')}\n**Palvelusaika 347**\n`);
  const message255 = getMessage(startDate, 255, `${days["255"].join(' ')}\n**Palvelusaika 255**\n`);
  const message147 = getMessage(startDate, 147, `${days["147"].join(' ')}\n**Palvelusaika 147**\n`);
  if (message347 === '') {
    return;
  }
  const embed = new Discord.MessageEmbed()
  .setTitle(`Aamulaskuri > ${entry}`)
  .setDescription(
    `${message347}\n${message255}\n${message147}`
  )
  .setColor('#36771c')
  .setURL('https://www.youtube.com/watch?v=Bc0IpLN-wGE')
  embeds[`${days["347"].join(' ')} ${days["255"].join(' ')} ${days["147"].join(' ')}`] = embed;
})
// Send message

const promises = [];

const sendEmbed = async (message, embed) => {
  await webhook.send(
    message,
    {
      username: 'Inttilaskuri',
      embeds: [embed],
      avatarURL: 'https://www.tuntsa.fi/kauppa/wp-content/uploads/2018/02/maastokangas_malli-1.jpg',
    }
  )
  return true;
}

Object.keys(embeds).forEach((pings) => {
  const embed = embeds[pings];
  promises.push(
    sendEmbed(pings, embed)
  )
})

Promise.all(promises).then(()=>webhook.destroy());
