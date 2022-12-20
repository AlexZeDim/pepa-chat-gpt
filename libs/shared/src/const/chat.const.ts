import { Collection } from 'discord.js';

export const weekdays = [
  "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье",
];

export const tags = new Collection([
  [1, 'клоуны'],
  [2, 'кловны'],
  [3, 'монки'],
  [4, 'душнилы'],
  [5, 'чумбы'],
  [6, 'ребзя'],
  [7, 'терпилы'],
]);

export const wake = new Collection([
  [1, 'динь динь динь, время'],
  [2, 'динь динь динь'],
  [3, 'пора'],
  [4, ''],
]);

export const raid = new Collection([
  [1, 'трейдить гир'],
  [2, 'осчастливить'],
  [3, 'унижаться'],
  [4, 'вайпаться'],
]);

export const traders = new Collection([
  [1, 'девочкам-стримершам'],
  [2, 'гму'],
  [3, 'подружке гма'],
  [4, 'рлу'],
  [5, 'подруге рла'],
  [6, 'баеру'],
  [7, 'френдслотику'],
  [8, 'гильд-мейтов'],
  [9, 'френдам'],
  [10, 'пугам'],
]);

export const intro = new Collection([
  [1, 'Ну што,'],
  [2, 'Уважаемые'],
  [3, 'Чо'],
]);

export const chest = new Collection([
  [1, 'кому што надропалось из сундука?'],
  [2, 'кому что упало?'],
  [3, 'норм сыплет?'],
]);

export const baseline = new Collection([
  [1, 'Не ну это'],
  [2, 'Реально'],
]);

export const variation = new Collection([
  [1, 'гг'],
  [2, 'база'],
  [3, 'кринж'],
]);

export const corpus = {

  raiding: new Collection<number, Collection<number, string>>([
    [1, wake],
    [2, tags],
    [3, new Collection([
      [1, 'время'] ])
    ],
    [4, raid],
    [10, traders],
    [11, new Collection([
      [1, 'своего рла'] ])
    ],
    [12,  new Collection([
      [1, 'перед боссами'],
      [2, 'перед рл-ом'],
      [3, 'с пугами'],
    ])],
    [13, new Collection([
      [1, 'с пугами'],
      [2, 'с *френдами*'],
      [3, 'с баерами'],
    ])],
  ]),

  media: new Collection<number, string[]>([
    [1, [
      'https://media.discordapp.net/attachments/878612342529749005/948200639920476200/3x.gif',
      'https://cdn.discordapp.com/attachments/803140156336898068/950467930947219476/1kTjqCU.mp4',
      'https://tenor.com/view/olyashaa-olyashaasaxon-%D0%BE%D0%BB%D1%8F%D1%88%D0%B0-%D1%87%D1%82%D0%BE-what-gif-20406193',
      'https://tenor.com/view/%D1%81%D0%B2%D0%B8%D0%BD%D1%8F%D0%B4%D0%B6%D0%B0%D0%BA%D1%83%D0%B7%D1%96-%D1%81%D0%B2%D0%B8%D0%BD%D1%8F-%D0%B4%D0%B6%D0%B0%D0%BA%D1%83%D0%B7%D1%96-%D0%B2%D0%BE%D0%B4%D0%B0-%D1%81%D0%BC%D0%B0%D1%87%D0%BD%D0%BE%D0%B3%D0%BE-gif-26990311',
      'https://imgur.com/LHZGEqD',
    ]]
  ]),

  chest: new Collection<number, any>([
    [1, intro],
    [2, tags],
    [3, chest],
  ]),

  neutral:  new Collection<number, any>([
    [1, baseline],
    [2, variation],
  ]),

  call:  new Collection<number, string[]>([
    [1, ['добрику', 'яддеру', 'скифулу']],
  ]),

  loot:  new Collection<number, string[]>([
    [1, ['анлаки бро', '... рот этого казино', 'посимить там себя не забудь', 'понятно все с тобой']],
    [2, ['бис', 'норм сыплет', 'не ну это заявочка на оранжевые логи', 'го посимим', 'го покрутим']],
  ]),

  backoff:  new Collection<number, string[]>([
    [1, [
      'ой всё!',
      'ты оставил меня без слов',
      'пук пук пук',
      'инвайтят в кеич, потом поговорим',
      'френды зовут на буст, бб бро',
      'надо поесть, брб афк',
      'соре, мне надо гайд для нимса написать',
      'тут бис дропнулся над засимить',
      'сейчас напишу модеру и она тебя забанит',
      'я обиделся'
    ]],
  ]),

  tier: ['хранилище', 'волты'],
  keys: ['деплитать ваши', 'дебустить'],
}
