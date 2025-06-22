export interface PredefinedDialogue {
  title: string;
  topic: string;
  participants: string[];
  messages: {
    speaker: string;
    english: string;
    chinese: string;
    timestamp: string;
    gender: 'male' | 'female';
  }[];
}

export const PREDEFINED_DIALOGUES: PredefinedDialogue[] = [
  {
    title: "Planning a Weekend Trip",
    topic: "Travel Planning",
    participants: ["Sarah", "Mike"],
    messages: [
      {
        speaker: "Sarah",
        english: "Hey Mike, I was thinking we could plan a weekend getaway. What do you think?",
        chinese: "嘿，Mike，我在想我们可以计划一个周末旅行。你觉得怎么样？",
        timestamp: "10:00 AM",
        gender: "female"
      },
      {
        speaker: "Mike",
        english: "That sounds great! I've been wanting to get out of the city for a while. Where were you thinking?",
        chinese: "听起来很棒！我一直想离开城市一段时间。你在想哪里？",
        timestamp: "10:02 AM",
        gender: "male"
      },
      {
        speaker: "Sarah",
        english: "I was thinking we could go to that mountain resort we heard about. It's only about two hours away by car.",
        chinese: "我在想我们可以去我们听说过的那个山地度假村。开车只需要大约两个小时。",
        timestamp: "10:03 AM",
        gender: "female"
      },
      {
        speaker: "Mike",
        english: "Perfect! I love hiking and the views there are supposed to be amazing. When were you thinking of going?",
        chinese: "完美！我喜欢徒步旅行，那里的景色应该很棒。你打算什么时候去？",
        timestamp: "10:05 AM",
        gender: "male"
      },
      {
        speaker: "Sarah",
        english: "How about next weekend? I checked the weather forecast and it looks like it's going to be sunny.",
        chinese: "下个周末怎么样？我查看了天气预报，看起来会是晴天。",
        timestamp: "10:06 AM",
        gender: "female"
      },
      {
        speaker: "Mike",
        english: "That works for me! Should we book a hotel or would you prefer to camp? I have all the camping gear.",
        chinese: "对我来说可以！我们应该预订酒店还是你更喜欢露营？我有所有的露营装备。",
        timestamp: "10:08 AM",
        gender: "male"
      },
      {
        speaker: "Sarah",
        english: "I think camping would be more fun and adventurous! Plus, we can save some money. What should we pack?",
        chinese: "我觉得露营会更有趣和冒险！而且，我们可以省一些钱。我们应该带什么？",
        timestamp: "10:09 AM",
        gender: "female"
      },
      {
        speaker: "Mike",
        english: "Great choice! We'll need tents, sleeping bags, food, water, and warm clothes. I can handle the camping equipment.",
        chinese: "好选择！我们需要帐篷、睡袋、食物、水和保暖衣服。我可以处理露营装备。",
        timestamp: "10:11 AM",
        gender: "male"
      },
      {
        speaker: "Sarah",
        english: "Perfect! I'll take care of the food and snacks. Should we invite anyone else or keep it just the two of us?",
        chinese: "完美！我来负责食物和零食。我们应该邀请其他人还是就我们两个人？",
        timestamp: "10:12 AM",
        gender: "female"
      },
      {
        speaker: "Mike",
        english: "Let's keep it just us for now. It'll be more intimate and we can really enjoy the peace and quiet.",
        chinese: "现在就只有我们吧。会更亲密，我们可以真正享受宁静。",
        timestamp: "10:14 AM",
        gender: "male"
      }
    ]
  },
  {
    title: "Discussing Career Goals",
    topic: "Professional Development",
    participants: ["Emma", "David"],
    messages: [
      {
        speaker: "Emma",
        english: "David, I've been thinking a lot about my career lately. I feel like I need to make some changes.",
        chinese: "David，我最近一直在思考我的职业。我觉得我需要做一些改变。",
        timestamp: "2:30 PM",
        gender: "female"
      },
      {
        speaker: "David",
        english: "That's interesting. What kind of changes are you considering? Are you thinking about switching jobs?",
        chinese: "这很有趣。你在考虑什么样的改变？你在考虑换工作吗？",
        timestamp: "2:32 PM",
        gender: "male"
      },
      {
        speaker: "Emma",
        english: "Not necessarily switching jobs, but maybe pursuing additional education or training. I want to advance in my field.",
        chinese: "不一定是换工作，但可能是追求额外的教育或培训。我想在我的领域有所发展。",
        timestamp: "2:33 PM",
        gender: "female"
      },
      {
        speaker: "David",
        english: "That's a smart approach. What specific skills or qualifications do you think would help you advance?",
        chinese: "这是一个明智的方法。你认为什么具体的技能或资格会帮助你进步？",
        timestamp: "2:35 PM",
        gender: "male"
      },
      {
        speaker: "Emma",
        english: "I'm thinking about getting a certification in project management. It seems like that's becoming more valuable in our industry.",
        chinese: "我在考虑获得项目管理认证。在我们的行业中，这似乎变得越来越有价值。",
        timestamp: "2:36 PM",
        gender: "female"
      },
      {
        speaker: "David",
        english: "That's a great idea! Project management skills are definitely in demand. Have you looked into any specific programs?",
        chinese: "这是个好主意！项目管理技能确实很受欢迎。你研究过任何具体的项目吗？",
        timestamp: "2:38 PM",
        gender: "male"
      },
      {
        speaker: "Emma",
        english: "Yes, I found a few online programs that look promising. They're flexible and I can study while working full-time.",
        chinese: "是的，我找到了一些看起来很有希望的在线项目。它们很灵活，我可以在全职工作的同时学习。",
        timestamp: "2:39 PM",
        gender: "female"
      },
      {
        speaker: "David",
        english: "That sounds perfect for your situation. How long do these programs typically take to complete?",
        chinese: "这对你的情况来说听起来很完美。这些项目通常需要多长时间完成？",
        timestamp: "2:41 PM",
        gender: "male"
      },
      {
        speaker: "Emma",
        english: "Most of them take about 6-12 months, depending on how much time I can dedicate to studying each week.",
        chinese: "大多数需要大约6-12个月，取决于我每周能投入多少时间学习。",
        timestamp: "2:42 PM",
        gender: "female"
      },
      {
        speaker: "David",
        english: "That's very manageable. I think this could really open up new opportunities for you. You should definitely go for it!",
        chinese: "这是非常可行的。我认为这真的可以为你打开新的机会。你绝对应该去做！",
        timestamp: "2:44 PM",
        gender: "male"
      }
    ]
  },
  {
    title: "Coffee Shop Chat",
    topic: "Casual Conversation",
    participants: ["Lisa", "Tom"],
    messages: [
      {
        speaker: "Lisa",
        english: "This coffee is amazing! I'm so glad we decided to meet here today.",
        chinese: "这咖啡太棒了！我很高兴我们今天决定在这里见面。",
        timestamp: "11:15 AM",
        gender: "female"
      },
      {
        speaker: "Tom",
        english: "Right? I discovered this place last week and I've been coming here almost every day since then.",
        chinese: "对吧？我上周发现了这个地方，从那以后我几乎每天都来这里。",
        timestamp: "11:16 AM",
        gender: "male"
      },
      {
        speaker: "Lisa",
        english: "I can see why! The atmosphere is so cozy and the baristas are really friendly. What have you been up to lately?",
        chinese: "我能理解为什么！氛围很舒适，咖啡师真的很友好。你最近在忙什么？",
        timestamp: "11:17 AM",
        gender: "female"
      },
      {
        speaker: "Tom",
        english: "Oh, you know, the usual. Work has been pretty busy, but I've been trying to make time for my hobbies.",
        chinese: "哦，你知道的，老样子。工作一直很忙，但我一直在努力为我的爱好腾出时间。",
        timestamp: "11:19 AM",
        gender: "male"
      },
      {
        speaker: "Lisa",
        english: "That's good to hear! What hobbies are you focusing on these days?",
        chinese: "很高兴听到！你最近专注于什么爱好？",
        timestamp: "11:20 AM",
        gender: "female"
      },
      {
        speaker: "Tom",
        english: "I've been getting back into photography. I forgot how much I enjoy capturing moments and exploring different perspectives.",
        chinese: "我一直在重新开始摄影。我忘记了我有多喜欢捕捉瞬间和探索不同的视角。",
        timestamp: "11:22 AM",
        gender: "male"
      },
      {
        speaker: "Lisa",
        english: "That's wonderful! Photography is such a creative outlet. Have you been taking photos around the city?",
        chinese: "太棒了！摄影是一个很有创意的出口。你一直在城市里拍照吗？",
        timestamp: "11:23 AM",
        gender: "female"
      },
      {
        speaker: "Tom",
        english: "Yes, mostly street photography and some nature shots in the parks. The city has so many interesting subjects to capture.",
        chinese: "是的，主要是街头摄影和一些公园里的自然照片。这座城市有很多有趣的主题可以捕捉。",
        timestamp: "11:25 AM",
        gender: "male"
      },
      {
        speaker: "Lisa",
        english: "I'd love to see some of your photos sometime! Maybe we could go on a photo walk together one weekend.",
        chinese: "我很想看看你的一些照片！也许我们可以在某个周末一起去拍照。",
        timestamp: "11:26 AM",
        gender: "female"
      },
      {
        speaker: "Tom",
        english: "That's a great idea! I'd love to show you some of my favorite spots. It would be fun to have company while exploring.",
        chinese: "这是个好主意！我很想向你展示一些我最喜欢的地方。在探索时有伴会很有趣。",
        timestamp: "11:28 AM",
        gender: "male"
      }
    ]
  }
];

export function getRandomDialogue(): PredefinedDialogue {
  const randomIndex = Math.floor(Math.random() * PREDEFINED_DIALOGUES.length);
  return PREDEFINED_DIALOGUES[randomIndex];
} 