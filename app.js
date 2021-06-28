/* 
Testausserverin #satunnaiset-koululaskuri.
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

const getMessage = (data, msg = "") => {
  const autumnStart = data[0]
  const autumnEnd = data[1]
  const springStart = data[2]
  const springEnd = data[3]
  const breaks = data[4]

  const toAutumnStart = diff(autumnStart);
  const toAutumnEnd = diff(autumnEnd);
  const toSpringStart = diff(springStart);
  const toSpringEnd = diff(springEnd);

  let breakk = null;
  breaks.forEach((b) => {
    if(!breakk) {
      if (b.daysTo > 0) {
        breakk = b;
      }
      return;
    }
    if (b.daysTo < 0) {
      return;
    }
    if (b.daysTo < breakk) {
      breakk = b;
    }
  })

  const breakMessage = `Seuraava loma on ${breakk.name}, johon on ${breakk.daysTo} päivää`;

  msg += '||'

  let currentBreak = null;
  breaks.forEach((b) => {
    if (currentBreak) {
      return;
    }
    if (b.daysTo <= 0 && b.daysToEnd >= 0) {
      currentBreak = b;
    }
  })
  if (currentBreak) {
    msg += `Nyt on loma "${currentBreak.name}". Lomaa jäljellä ${currentBreak.daysToEnd} päivää`
  } else if(toAutumnStart > 0) {
    if (data[5]) return '';
    msg += data[5] ? `` : `Kesälomaa jäljellä ${toAutumnStart} päivää, mee nauttimaan saatana`;
  } else if(toAutumnStart == 0) {
    msg += `Lukuvuosi alkaa tänään. ${toAutumnEnd} syyslukukauden päättymiseen, ${toSpringEnd} päivää lukuvuoden päättymiseen.`;
  } else if (toAutumnEnd > 0) {
    msg += `Syyslukukautta jäljellä ${toAutumnEnd} päivää ja ${toSpringEnd} lukuvuoden päättymiseen.`;
  } else if (toAutumnEnd == 0) {
    msg += `Syyslukukausi loppuu tänään. Kevätlukukauden alkuun ${toSpringStart} päivää.`;
  } else if (toSpringStart > 0) {
    msg += `Kevätlukukauden alkuun ${toSpringStart} päivää.`;
  } else if (toSpringStart == 0) {
    msg += `Kevätlukukausi alkaa tänään. Kevätlukukauden loppuun ${toSpringEnd} päivää.`;
  } else if (toSpringEnd > 0) {
    msg += `Kevätlukukautta jäljellä ${toSpringEnd} päivää.`;
  } else if (toSpringEnd == 0) {
    msg += `Kesäloma alkaa! :sun_with_face:`;
  } else {
    return ''; // Kesäloma!
  }
  msg += `${breakk ? '\n' + breakMessage + '\n': ''}`
  msg += '||'
  return msg;
}  

// 1 saapumiserä = embed

const pings = [];
const messages = []
Object.keys(config.subscribers).forEach((entry) => {
  console.log('Calculating user ' + entry)
  const user = config.subscribers[entry];
  const autumnStart = new Date(user.autumnStart);
  const autumnEnd = new Date(user.autumnEnd);
  const springStart = new Date(user.springStart);
  const springEnd = new Date(user.springEnd);
  const breaks = []
  user.breaks.forEach((b) => {
    breaks.push({
      name: b.name,
      start: new Date(b.start),
      end: new Date(b.end),
      daysTo: diff(new Date(b.start)),
      daysToEnd: diff(new Date(b.end))
    })
  });

  const message = getMessage([autumnStart, autumnEnd, springStart, springEnd, breaks, user.hideOnSummerVacation], `${entry}\n`);
  if (message === '') {
    return;
  }
  pings.push(entry);
  messages.push(`${message}`);
})

if (pings.length === 0) {
  console.log('No recipients')
  webhook.destroy();
  return;
}
// Send message

const embed = new Discord.MessageEmbed()
  .setTitle(`Koululaskuri`)
  .setDescription(
    `${messages.join('\n')}`
  )
  .setColor('#96227d')
  .setURL('https://www.youtube.com/watch?v=b5FiqQ_VVKo')

webhook.send(
  pings.join(' '),
  {
    username: 'Koululaskuri',
    embeds: [embed],
    avatarURL: 'https://media.discordapp.net/attachments/710903188018167930/859162126131003462/school.jpg',
  }
).then(()=>webhook.destroy());
