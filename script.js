// ===== OPENING INTRO GUARANTEE =====
(function(){
  function closeIntro(){
    var intro=document.getElementById('openingIntro');
    if(intro){
      intro.classList.add('hidden','force-remove');
      intro.style.setProperty('display','none','important');
      intro.style.setProperty('opacity','0','important');
      intro.style.setProperty('visibility','hidden','important');
      intro.style.setProperty('pointer-events','none','important');
      if(intro.parentNode) intro.parentNode.removeChild(intro);
    }
  }
  window.skipOpeningIntro = window.skipOpeningIntro || closeIntro;
  setTimeout(function(){ if(window.skipOpeningIntro) window.skipOpeningIntro(); else closeIntro(); }, 6200);
})();

// GAME RULES
const TC=[
  {hex:'#3498DB',light:'rgba(52,152,219,.22)'},
  {hex:'#E74C3C',light:'rgba(231,76,60,.22)'},
  {hex:'#2ECC71',light:'rgba(46,204,113,.22)'},
  {hex:'#9B59B6',light:'rgba(155,89,182,.22)'},
  {hex:'#F5C518',light:'rgba(245,197,24,.22)'},
];

let players=[],teams=[],nPid=1,nTid=1;
let selPid=null,selP1=null,selP2=null,selWheelPid=null,selChainP1=null,selChainP2=null,selTabooPid=null,selHigherPid=null,selAffariPid=null,selMoviePid=null,selGhigliottinaPid=null,selectedHolCategory='videogiochi';
let intesaWinner=null;
let intesaPlayers={p1:null,p2:null};
let activeStatsGame=null;
let globalLeaderboard=[];
let registeredUsers=[];
let userPresenceMap={};
let currentUserProfile=null;
let currentUserLeaderboard=null;
let pendingGameInvite=null;
let pendingPlayModeGame=null,selectedPlayMode='local';
let activeGameSessionId=null,activeGameSessionGame=null,unsubscribeGameSession=null,applyingRemoteWheelState=false,applyingRemoteSessionState=false;
let unsubscribeLeaderboard=null,unsubscribeRegisteredUsers=null,unsubscribeCurrentUserProfile=null,unsubscribeCurrentUserLeaderboard=null,unsubscribeGameInvites=null;
let presenceRef=null,presenceConnectedRef=null,presenceConnectedCallback=null,allPresenceRef=null;
let tabooScoreEventsRef=null,tabooScoreEventsStartedAt=Date.now(),processedTabooScoreEvents=new Set();
let auaAudio=null,auaErrorAudio=null,auaAutoStartListener=null,auaAutoStarted=false,auaThemeResumeTime=0;
let rdfAudio=null,rdfAutoStartListener=null,rdfAutoStarted=false;
let wheelIntroVideoPlaying=false,wheelIntroFinishHandler=null;
let ghigIntroAudio=null,ghigThemeAudio=null,ghigIntroTimer=null;
let ttsVoices=[];
let ttsVoiceURI=localStorage.getItem('tvgn-tts-voice')||'';
let ttsRate=parseFloat(localStorage.getItem('tvgn-tts-rate'))||.9;
let onboardingStep=0,onboardingStarted=false;
const ANON_IDLE_LIMIT_MS=30*60*1000;
let anonymousCleanupTimer=null,anonymousCleanupInProgress=false,anonymousLifecycleBound=false;

const APP_ROUTES={
  's-hero':'/',
  's-setup':'/configura',
  's-pick-affari':'/affari-tuoi',
  's-affari':'/affari-tuoi/studio',
  's-pick-movie':'/indovina-film',
  's-movieguess':'/indovina-film/gioca',
  's-pick-ghigliottina':'/ghigliottina',
  's-ghigliottina':'/ghigliottina/finale'
};
const SCREEN_BY_ROUTE=Object.entries(APP_ROUTES).reduce((acc,[screen,path])=>{
  acc[path]=screen;
  return acc;
},{'/home':'s-hero','/index.html':'s-hero'});
let appRoutingReady=false;

const PROFILE_COLORS=[
  {bg:'#F5C518',color:'#08081A'},
  {bg:'#3498DB',color:'#fff'},
  {bg:'#2ECC71',color:'#06130F'},
  {bg:'#E74C3C',color:'#fff'},
  {bg:'#9B59B6',color:'#fff'},
  {bg:'#ECF0F1',color:'#08081A'}
];

const DEFAULT_PROFILE_STATS={
  gamesPlayed:0,
  wins:0,
  lastGame:'—'
};

const ONBOARDING_STEPS=[
  {
    icon:'🎮',
    mini:'Scegli',
    title:'Scegli un gioco',
    text:'Dalla home trovi tutti i giochi disponibili: scegli quello che vuoi e prepara la serata.'
  },
  {
    icon:'👥',
    mini:'Giocatori',
    title:'Configura i giocatori',
    text:'Aggiungi amici, squadre e timer dalla configurazione. Se siete online, invita profili registrati.'
  },
  {
    icon:'📺',
    mini:'Partita',
    title:'Gioca sullo stesso schermo',
    text:'Ogni gioco guida turno, punteggi e azioni principali con pulsanti grandi pensati per il mobile.'
  },
  {
    icon:'🏆',
    mini:'Punti',
    title:'Salva i risultati',
    text:'Quando hai un account, statistiche e classifica restano associate al tuo profilo.'
  }
];

const AUA_Q=[
{q:"Di che colore è il cielo sereno?",a:["Verde","Blu"],wrong:"Verde"},
{q:"Quanti giorni ha una settimana?",a:["7","10"],wrong:"10"},
{q:"Quale animale dice 'bau'?",a:["Gatto","Cane"],wrong:"Gatto"},
{q:"Quanto fa 2+2?",a:["4","5"],wrong:"5"},
{q:"Quale stagione viene dopo l’inverno?",a:["Autunno","Primavera"],wrong:"Autunno"},
{q:"Qual è il contrario di freddo?",a:["Caldo","Ghiaccio"],wrong:"Ghiaccio"},
{q:"Quale pianeta è noto come pianeta rosso?",a:["Venere","Marte"],wrong:"Venere"},
{q:"Qual è il risultato di 10×10?",a:["100","110"],wrong:"110"},
{q:"Quale organo pompa il sangue?",a:["Fegato","Cuore"],wrong:"Fegato"},
{q:"Quale animale vive nel mare?",a:["Pesce","Mucca"],wrong:"Mucca"},
{q:"Qual è lo sport più praticato al mondo?",a:["Tennis","Calcio"],wrong:"Tennis"},
{q:"Qual è il simbolo dell’acqua?",a:["H2O","O2"],wrong:"O2"},
{q:"Quale colore si ottiene mescolando rosso e blu?",a:["Verde","Viola"],wrong:"Verde"},
{q:"Quale strumento misura il tempo?",a:["Orologio","Righello"],wrong:"Righello"},
{q:"Qual è il risultato di 5 per 5?",a:["20","25"],wrong:"20"},
{q:"Quale animale è il re della savana?",a:["Leone","Elefante"],wrong:"Elefante"},
{q:"Quanti minuti ci sono in un’ora?",a:["100","60"],wrong:"100"},
{q:"Qual è il contrario di notte?",a:["Giorno","Sera"],wrong:"Sera"},
{q:"Quale materia studia i numeri?",a:["Storia","Matematica"],wrong:"Storia"},
{q:"Quale è un linguaggio di programmazione?",a:["Python","Serpente"],wrong:"Serpente"},
{q:"Quale frutto è giallo e lungo?",a:["Mela","Banana"],wrong:"Mela"},
{q:"Quale animale fa 'miao'?",a:["Gatto","Cane"],wrong:"Cane"},
{q:"Quanto fa 3*3?",a:["6","7"],wrong:"6"},
{q:"Qual è il contrario di grande?",a:["Piccolo","Alto"],wrong:"Alto"},
{q:"Quale pianeta è più vicino al Sole?",a:["Marte","Mercurio"],wrong:"Marte"},
{q:"Quale sport usa la racchetta?",a:["Tennis","Calcio"],wrong:"Calcio"},
{q:"Qual è il simbolo dell’oro?",a:["Ag","Au"],wrong:"Ag"},
{q:"Quanti lati ha un quadrato?",a:["4","3"],wrong:"3"},
{q:"Quale organo usiamo per vedere?",a:["Naso","Occhi"],wrong:"Naso"},
{q:"Quale animale vola?",a:["Uccello","Pesce"],wrong:"Pesce"},
{q:"Qual è il risultato di 12+8?",a:["18","20"],wrong:"18"},
{q:"Quale è un colore primario?",a:["Rosso","Rosa"],wrong:"Rosa"},
{q:"Quale mese viene dopo gennaio?",a:["Marzo","Febbraio"],wrong:"Marzo"},
{q:"Quale animale è domestico?",a:["Cane","Lupo"],wrong:"Lupo"},
{q:"Quanto fa 9-3?",a:["5","6"],wrong:"5"},
{q:"Quale materia studia il passato?",a:["Storia","Fisica"],wrong:"Fisica"},
{q:"Quale strumento musicale ha i tasti bianchi e neri?",a:["Chitarra","Pianoforte"],wrong:"Chitarra"},
{q:"Qual è il contrario di alto?",a:["Basso","Lungo"],wrong:"Lungo"},
{q:"Quale pianeta ha gli anelli?",a:["Venere","Saturno"],wrong:"Venere"},
{q:"Quale animale è più veloce sulla terra?",a:["Ghepardo","Tartaruga"],wrong:"Tartaruga"},
{q:"Quanto fa 6 per 6?",a:["30","36"],wrong:"30"},
{q:"Quale è un metallo?",a:["Ferro","Legno"],wrong:"Legno"},
{q:"Quale animale vive nella fattoria?",a:["Squalo","Mucca"],wrong:"Squalo"},
{q:"Quale è il contrario di acceso?",a:["Spento","Caldo"],wrong:"Caldo"},
{q:"Quale materia studia la natura?",a:["Italiano","Scienze"],wrong:"Italiano"},
{q:"Quale sport si gioca con il pallone ovale?",a:["Rugby","Basket"],wrong:"Basket"},
// {q:"Quale bevi con gusto?",a:["Sborra","Succo di frutta"],wrong:"Succo di frutta"},
{q:"E' giusto dire che in Italia non si guida a sinistra?",a:["Sì","No"],wrong:"Sì"},
{q:"E' giusto dire che Boni è gay?",a:["Sì","No"],wrong:"No"},
{q:"Solo Marzo ha 28 giorni",a:["Vero","Falso"],wrong:"Vero"},
];

const ERE_WORDS=[
{clue:"Qual è la capitale dell’Italia?",word:"ROMA"},
{clue:"Qual è il fiume più lungo d’Italia?",word:"PO"},
{clue:"Chi ha dipinto la Cappella Sistina?",word:"MICHELANGELO"},
{clue:"In che continente si trova l’Egitto?",word:"AFRICA"},
{clue:"Qual è il pianeta più grande del sistema solare?",word:"GIOVE"},
{clue:"Chi ha scritto I Promessi Sposi?",word:"MANZONI"},
{clue:"Qual è la capitale della Francia?",word:"PARIGI"},
{clue:"Quanti continenti ci sono?",word:"SETTE"},
{clue:"Qual è il simbolo chimico dell’acqua?",word:"H2O"},
{clue:"Chi ha scoperto l’America?",word:"COLOMBO"},
{clue:"Qual è la capitale della Spagna?",word:"MADRID"},
{clue:"Qual è il mare tra Italia e Grecia?",word:"IONIO"},
{clue:"Chi ha scritto la Divina Commedia?",word:"DANTE"},
{clue:"Qual è il pianeta rosso?",word:"MARTE"},
{clue:"Qual è il monte più alto del mondo?",word:"EVEREST"},
{clue:"In che anno è caduto l’Impero romano d’Occidente?",word:"476"},
{clue:"Qual è la capitale del Regno Unito?",word:"LONDRA"},
{clue:"Qual è l’organo principale della respirazione?",word:"POLMONI"},
{clue:"Qual è il simbolo dell’oro?",word:"AU"},
{clue:"Chi ha dipinto la Gioconda?",word:"LEONARDO"},
{clue:"Qual è la capitale della Germania?",word:"BERLINO"},
{clue:"Qual è il lago più grande d’Italia?",word:"GARDA"},
{clue:"Qual è il pianeta più vicino al Sole?",word:"MERCURIO"},
{clue:"Chi ha scritto Pinocchio?",word:"COLLODI"},
{clue:"Qual è la capitale del Giappone?",word:"TOKYO"},
{clue:"Qual è la lingua ufficiale del Brasile?",word:"PORTOGHESE"},
{clue:"Qual è il mare più grande del mondo?",word:"PACIFICO"},
{clue:"Qual è il simbolo del ferro?",word:"FE"},
{clue:"Chi ha inventato la lampadina?",word:"EDISON"},
{clue:"Qual è la capitale della Russia?",word:"MOSCA"},
{clue:"Qual è il fiume che attraversa Roma?",word:"TEVERE"},
{clue:"Qual è la capitale della Cina?",word:"PECHINO"},
{clue:"Quanti giorni ha un anno bisestile?",word:"366"},
{clue:"Chi ha scritto Harry Potter?",word:"ROWLING"},
{clue:"Qual è il pianeta con gli anelli?",word:"SATURNO"},
{clue:"Qual è la capitale dell’Australia?",word:"CANBERRA"},
{clue:"Qual è il mare più salato?",word:"MORTO"},
{clue:"Qual è il simbolo del sodio?",word:"NA"},
{clue:"Chi ha dipinto L’Ultima Cena?",word:"LEONARDO"},
{clue:"Qual è la capitale del Canada?",word:"OTTAWA"},
{clue:"Qual è il monte più alto d’Italia?",word:"MONTE BIANCO"},
{clue:"Qual è il gas che respiriamo di più?",word:"AZOTO"},
{clue:"Chi ha scritto La Traviata?",word:"VERDI"},
{clue:"Qual è la capitale dell’India?",word:"NUOVA DELHI"},
{clue:"Qual è il pianeta più piccolo del sistema solare?",word:"MERCURIO"},
{clue:"Qual è il mare tra Italia e Africa?",word:"MEDITERRANEO"},
{clue:"Qual è la capitale del Messico?",word:"CITTA DEL MESSICO"},
{clue:"Qual è il simbolo del carbonio?",word:"C"},
{clue:"Chi ha dipinto La Nascita di Venere?",word:"BOTTICELLI"},
{clue:"Qual è la capitale della Grecia?",word:"ATENE"}
];

const WHEEL_PHRASES=[
  {cat:"Tempo libero",text:"FESTA DI COMPLEANNO"},
  {cat:"Proverbio",text:"CHI DORME NON PIGLIA PESCI"},
  {cat:"Tempo libero",text:"GITA IN MONTAGNA"},
  {cat:"Cinema",text:"LA GRANDE BELLEZZA"},
  {cat:"Cucina",text:"SPAGHETTI AL POMODORO"},
  {cat:"Modo di dire",text:"NON E TUTTO ORO QUEL CHE LUCCICA"},
  {cat:"Modo di dire",text:"ACQUA IN BOCCA"},
  {cat:"Viaggi",text:"UN BIGLIETTO PER PARIGI"},
  {cat:"Sport",text:"GOL ALL ULTIMO MINUTO"},
  {cat:"Musica",text:"SOTTO IL CIELO DI ROMA"},
  {cat:"Tecnologia",text:"SMARTPHONE DI ULTIMA GENERAZIONE"},
  {cat:"Sport",text:"LA PARTITA DELLA DOMENICA"},
  {cat:"Cinema",text:"RITORNO AL FUTURO"},
  {cat:"Oggetto",text:"TELECOMANDO SUL DIVANO"},
  {cat:"Estate",text:"GELATO ALLA STRACCIATELLA"},
  {cat:"Sport",text:"FINALE DI CHAMPIONS LEAGUE"},
  {cat:"Casa",text:"CHIAVI NEL CASSETTO"},
  {cat:"Cinema",text:"AVATAR"},
  {cat:"Cinema",text:"IL RE LEONE"},
  {cat:"TV",text:"APPLAUSI IN STUDIO"},
  {cat:"Modo di dire",text:"L ERBA DEL VICINO E SEMPRE PIU VERDE"},
  {cat:"Tempo libero",text:"VACANZA AL MARE"},
  {cat:"Fortuna",text:"COLPO DI SCENA FINALE"},
  {cat:"Tecnologia",text:"INTELLIGENZA ARTIFICIALE"},
  {cat:"Modo di dire",text:"IL TEMPO E DENARO"},
  {cat:"Tecnologia",text:"RETE WIFI INSTABILE"},
];

const CHAIN_ROUNDS=[
  {start:"CASA",words:["RIPOSO","MATTUTINO","BUONGIORNO","SERALE"]},
  {start:"MARE",words:["ONDA","RADIO","FREQUENZA","MUSICA"]},
  {start:"SOLE",words:["LUNA","PIENA","NOTTE","STELLATA"]},
  {start:"LIBRO",words:["PAGINA","BIANCA","NEVE","MONTAGNA"]},
  {start:"TEMPO",words:["ORO","ANELLO","DITO","INDICE"]},
  {start:"CUORE",words:["BATTITO","MANI","APPLAUSO","PUBBLICO"]},
  {start:"STRADA",words:["VIAGGIO","VALIGIA","AEREO","PORTO"]},
  {start:"SCUOLA",words:["BANCO","POSTA","LETTERA","ALFABETO"]},
  {start:"FUOCO",words:["FIAMMA","OLIMPICA","GIOCHI","SQUADRA"]},
  {start:"FESTA",words:["TORTA","CANDELA","LUCE","STELLA"]}
];

const HIGHER_LOWER_BANKS={
  videogiochi:{
    label:'Videogiochi',
    unit:'copie vendute stimate',
    sub:'Classici e bestseller',
    items:[
      {name:'Minecraft',value:300000000,display:'300M copie',emoji:'⛏️',image:'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80'},
      {name:'Grand Theft Auto V',value:200000000,display:'200M copie',emoji:'🚗',image:'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80'},
      {name:'Tetris',value:100000000,display:'100M+ copie',emoji:'🧱',image:'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=900&q=80'},
      {name:'Wii Sports',value:82900000,display:'82,9M copie',emoji:'🎾',image:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80'},
      {name:'PUBG',value:75000000,display:'75M copie',emoji:'🎮',image:'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=900&q=80'},
      {name:'Mario Kart 8 Deluxe',value:69000000,display:'69M copie',emoji:'🏁',image:'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80'},
      {name:'Red Dead Redemption 2',value:61000000,display:'61M copie',emoji:'🤠',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'},
      {name:'The Witcher 3',value:50000000,display:'50M copie',emoji:'⚔️',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Overwatch',value:50000000,display:'50M giocatori/copie',emoji:'🛡️',image:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'},
      {name:'The Elder Scrolls V: Skyrim',value:60000000,display:'60M copie',emoji:'🐉',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Terraria',value:58000000,display:'58M copie',emoji:'⛏️',image:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'},
      {name:'Pokemon Rosso/Blu/Verde',value:47500000,display:'47,5M copie',emoji:'⚡',image:'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=900&q=80'},
      {name:'Animal Crossing: New Horizons',value:45000000,display:'45M copie',emoji:'🏝️',image:'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80'},
      {name:'Super Mario Bros.',value:40200000,display:'40,2M copie',emoji:'🍄',image:'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'},
      {name:'Mario Kart Wii',value:37300000,display:'37,3M copie',emoji:'🏎️',image:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80'},
      {name:'The Legend of Zelda: Breath of the Wild',value:33000000,display:'33M copie',emoji:'🗡️',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Call of Duty: Modern Warfare',value:30000000,display:'30M copie',emoji:'🎖️',image:'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80'},
      {name:'Diablo III',value:30000000,display:'30M copie',emoji:'🔥',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Human: Fall Flat',value:30000000,display:'30M copie',emoji:'🧍',image:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'},
      {name:'The Last of Us',value:20000000,display:'20M copie',emoji:'🍃',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'God of War',value:19500000,display:'19,5M copie',emoji:'🪓',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Cyberpunk 2077',value:25000000,display:'25M copie',emoji:'🌃',image:'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80'},
      {name:'Hogwarts Legacy',value:24000000,display:'24M copie',emoji:'🪄',image:'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80'},
      {name:'Elden Ring',value:25000000,display:'25M copie',emoji:'💍',image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'},
      {name:'Stardew Valley',value:30000000,display:'30M copie',emoji:'🌾',image:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'},
      {name:'Among Us',value:500000000,display:'500M download',emoji:'🚀',image:'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80'},
      {name:'Fall Guys',value:50000000,display:'50M giocatori',emoji:'🏆',image:'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'},
      {name:'FIFA 23',value:10000000,display:'10M+ copie',emoji:'⚽',image:'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=80'}
    ]
  },
  case:{
    label:'Case',
    unit:'valore immobiliare stimato',
    sub:'Dalla villa al monolocale',
    items:[
      {name:'Attico a Manhattan',value:95000000,display:'95M €',emoji:'🌆',image:'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa fronte mare a Malibu',value:78000000,display:'78M €',emoji:'🌊',image:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80'},
      {name:'Chalet di lusso a St. Moritz',value:42000000,display:'42M €',emoji:'🏔️',image:'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80'},
      {name:'Casale in Toscana',value:8500000,display:'8,5M €',emoji:'🍇',image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'},
      {name:'Loft industriale a Milano',value:2200000,display:'2,2M €',emoji:'🏙️',image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'},
      {name:'Villetta con giardino',value:650000,display:'650K €',emoji:'🏡',image:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80'},
      {name:'Bilocale in centro',value:310000,display:'310K €',emoji:'🪟',image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'},
      {name:'Tiny house',value:85000,display:'85K €',emoji:'🧳',image:'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa sul Lago di Como',value:36000000,display:'36M €',emoji:'🚤',image:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80'},
      {name:'Masseria in Puglia',value:6200000,display:'6,2M €',emoji:'🌿',image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa a Ibiza',value:24500000,display:'24,5M €',emoji:'🌅',image:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80'},
      {name:'Penthouse a Dubai',value:52000000,display:'52M €',emoji:'🏙️',image:'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80'},
      {name:'Castello in Scozia',value:14500000,display:'14,5M €',emoji:'🏰',image:'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80'},
      {name:'Casa colonica ristrutturata',value:1250000,display:'1,25M €',emoji:'🚜',image:'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80'},
      {name:'Appartamento a Parigi',value:3200000,display:'3,2M €',emoji:'🥐',image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'},
      {name:'Casa sul canale ad Amsterdam',value:4800000,display:'4,8M €',emoji:'🚲',image:'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa in Costa Smeralda',value:29000000,display:'29M €',emoji:'⛵',image:'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=900&q=80'},
      {name:'Casa minimalista in Giappone',value:1800000,display:'1,8M €',emoji:'🎋',image:'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80'},
      {name:'Ranch in Montana',value:18500000,display:'18,5M €',emoji:'🐎',image:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80'},
      {name:'Baita in Trentino',value:980000,display:'980K €',emoji:'🪵',image:'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=900&q=80'},
      {name:'Studio vicino universita',value:165000,display:'165K €',emoji:'🎓',image:'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'},
      {name:'Palazzo storico a Venezia',value:41000000,display:'41M €',emoji:'🎭',image:'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80'},
      {name:'Casa galleggiante',value:420000,display:'420K €',emoji:'⚓',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa moderna a Los Angeles',value:68000000,display:'68M €',emoji:'🎬',image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80'},
      {name:'Duplex a Londra',value:12500000,display:'12,5M €',emoji:'☂️',image:'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=900&q=80'},
      {name:'Villa con vigneto in Napa Valley',value:22500000,display:'22,5M €',emoji:'🍷',image:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80'},
      {name:'Casa prefabbricata premium',value:240000,display:'240K €',emoji:'📦',image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80'},
      {name:'Monolocale periferico',value:92000,display:'92K €',emoji:'🔑',image:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'}
    ]
  },
  oggetti:{
    label:'Oggetti',
    unit:'prezzo stimato',
    sub:'Aste, lusso e tecnologia',
    items:[
      {name:'Diamante rosa raro',value:57000000,display:'57M €',emoji:'💎',image:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80'},
      {name:'Ferrari da collezione',value:32000000,display:'32M €',emoji:'🏎️',image:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80'},
      {name:'Orologio di lusso raro',value:17000000,display:'17M €',emoji:'⌚',image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'},
      {name:'Chitarra firmata da rockstar',value:6000000,display:'6M €',emoji:'🎸',image:'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=900&q=80'},
      {name:'Sneaker limited edition',value:1800000,display:'1,8M €',emoji:'👟',image:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80'},
      {name:'Primo iPhone sigillato',value:190000,display:'190K €',emoji:'📱',image:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80'},
      {name:'Set LEGO raro',value:12000,display:'12K €',emoji:'🧩',image:'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=80'},
      {name:'Bici da corsa top',value:9000,display:'9K €',emoji:'🚲',image:'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80'},
      {name:'Birkin Himalayan',value:380000,display:'380K €',emoji:'👜',image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'},
      {name:'Carta Pokemon Charizard 1st Edition',value:420000,display:'420K €',emoji:'🔥',image:'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=900&q=80'},
      {name:'Maglia storica di Maradona',value:8500000,display:'8,5M €',emoji:'⚽',image:'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80'},
      {name:'Pianoforte da concerto Steinway',value:180000,display:'180K €',emoji:'🎹',image:'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=900&q=80'},
      {name:'Yacht di lusso medio',value:24000000,display:'24M €',emoji:'🛥️',image:'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=900&q=80'},
      {name:'Jet privato usato',value:36000000,display:'36M €',emoji:'✈️',image:'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&w=900&q=80'},
      {name:'Computer Apple-1',value:905000,display:'905K €',emoji:'💻',image:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80'},
      {name:'Fumetto Action Comics n.1',value:3200000,display:'3,2M €',emoji:'🦸',image:'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80'},
      {name:'Moneta Double Eagle 1933',value:18800000,display:'18,8M €',emoji:'🪙',image:'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=900&q=80'},
      {name:'Bottiglia Romanée-Conti',value:550000,display:'550K €',emoji:'🍷',image:'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=900&q=80'},
      {name:'Sedia di design vintage',value:45000,display:'45K €',emoji:'🪑',image:'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=900&q=80'},
      {name:'Macchina fotografica Leica rara',value:2400000,display:'2,4M €',emoji:'📷',image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'},
      {name:'Spada samurai antica',value:780000,display:'780K €',emoji:'🗡️',image:'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=900&q=80'},
      {name:'Violino Stradivari',value:15500000,display:'15,5M €',emoji:'🎻',image:'https://images.unsplash.com/photo-1465821185615-20b3c2fbf41b?auto=format&fit=crop&w=900&q=80'},
      {name:'Anello con zaffiro reale',value:1200000,display:'1,2M €',emoji:'💍',image:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80'},
      {name:'Drone cinema professionale',value:25000,display:'25K €',emoji:'🚁',image:'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80'},
      {name:'Console Nintendo PlayStation prototype',value:360000,display:'360K €',emoji:'🕹️',image:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80'},
      {name:'Tappeto persiano antico',value:950000,display:'950K €',emoji:'🧶',image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'},
      {name:'Casco Formula 1 autografato',value:125000,display:'125K €',emoji:'🏁',image:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80'},
      {name:'Diamante blu raro',value:48000000,display:'48M €',emoji:'🔷',image:'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80'}
    ]
  },
  arte:{
    label:"Opere d'arte",
    unit:'prezzo d’asta stimato',
    sub:'Capolavori e mercato',
    items:[
      {name:'Salvator Mundi',value:450000000,display:'450M €',emoji:'🖼️',image:'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80'},
      {name:'Interchange',value:300000000,display:'300M €',emoji:'🎨',image:'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80'},
      {name:'I giocatori di carte',value:250000000,display:'250M €',emoji:'♣️',image:'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80'},
      {name:'Nafea Faa Ipoipo',value:210000000,display:'210M €',emoji:'🌺',image:'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=80'},
      {name:'Number 17A',value:200000000,display:'200M €',emoji:'🟨',image:'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80'},
      {name:'Ninfee',value:84000000,display:'84M €',emoji:'🪷',image:'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80'},
      {name:'Scultura contemporanea',value:58000000,display:'58M €',emoji:'🗿',image:'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80'},
      {name:'Fotografia d’autore',value:4300000,display:'4,3M €',emoji:'📷',image:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'},
      {name:'Les Femmes d’Alger',value:179000000,display:'179M €',emoji:'👥',image:'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80'},
      {name:'Nu couché',value:170000000,display:'170M €',emoji:'🖌️',image:'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80'},
      {name:'Three Studies of Lucian Freud',value:142000000,display:'142M €',emoji:'🎭',image:'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=900&q=80'},
      {name:'Balloon Dog',value:58400000,display:'58,4M €',emoji:'🎈',image:'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80'},
      {name:'Rabbit',value:91000000,display:'91M €',emoji:'✨',image:'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80'},
      {name:'Meules',value:110000000,display:'110M €',emoji:'🌾',image:'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80'},
      {name:'Untitled Basquiat',value:110500000,display:'110,5M €',emoji:'👑',image:'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80'},
      {name:'Silver Car Crash',value:105000000,display:'105M €',emoji:'🚗',image:'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80'},
      {name:'Dora Maar au Chat',value:95200000,display:'95,2M €',emoji:'🐈',image:'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80'},
      {name:'Portrait of Adele Bloch-Bauer II',value:87900000,display:'87,9M €',emoji:'👒',image:'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80'},
      {name:'Triptych, 1976',value:86200000,display:'86,2M €',emoji:'🧩',image:'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=900&q=80'},
      {name:'Orange, Red, Yellow',value:86800000,display:'86,8M €',emoji:'🟧',image:'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80'},
      {name:'Turquoise Marilyn',value:80000000,display:'80M €',emoji:'💄',image:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=900&q=80'},
      {name:'False Start',value:80000000,display:'80M €',emoji:'🏁',image:'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=80'},
      {name:'White Center',value:72800000,display:'72,8M €',emoji:'⬜',image:'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80'},
      {name:'L’Homme qui marche I',value:104000000,display:'104M €',emoji:'🚶',image:'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80'},
      {name:'Poppy Flowers',value:50000000,display:'50M €',emoji:'🌺',image:'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80'},
      {name:'Girl with Balloon',value:23000000,display:'23M €',emoji:'🎈',image:'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=900&q=80'},
      {name:'Scultura da galleria emergente',value:120000,display:'120K €',emoji:'🪨',image:'https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=900&q=80'},
      {name:'Stampa numerata contemporanea',value:18000,display:'18K €',emoji:'🖨️',image:'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=900&q=80'}
    ]
  }
};

const SARABANDA_TRACKS=[
  {title:"40 Gradi",artist:"Simba la Rue",src:"Sarabanda/40-gradi-spotdownorg_NdFO2YGS.mp3"},
  {title:"Soldi In Nero",artist:"Shiva feat. Sfera Ebbasta",src:"Sarabanda/soldi-in-nero-feat-sfera-ebbasta-spotdownorg_OeJNjolX.mp3"},
  {title:"Tran Tran",artist:"Sfera Ebbasta",src:"Sarabanda/tran-tran-spotdownorg_B78eu9SP.mp3"},
  {title:"Mirandote",artist:"",src:"Sarabanda/mirandote-spotdownorg_OJDsAMH9.mp3"},
  {title:"Nuevayol",artist:"Bad Bunny",src:"Sarabanda/nuevayol-spotdownorg_O6bqnvIK.mp3"},
  {title:"Obsessed",artist:"Shiva",src:"Sarabanda/obsessed-spotdownorg_xfKTnGZT.mp3"},
  {title:"Dodge Durango",artist:"Artie 5ive",src:"Sarabanda/dodge-durango-spotdownorg_A1IIquP0.mp3"},
  {title:"Eoo",artist:"Bad Bunny",src:"Sarabanda/eoo-spotdownorg_R3s93Tzw.mp3"},
  {title:"Visiera A Becco",artist:"Sfera Ebbasta",src:"Sarabanda/visiera-a-becco-spotdownorg_oGUVigMu.mp3"},
  {title:"Hoodrich",artist:"Artie 5ive feat. Rondo",src:"Sarabanda/hoodrich-spotdownorg_YQKq8VsT.mp3"},
  {title:"Slatt",artist:"Rondo feat. Capo Plaza",src:"Sarabanda/slatt-feat-capo-plaza-spotdownorg_A9k6udvk.mp3"},
  {title:"Take 6",artist:"Shiva",src:"Sarabanda/take-6-spotdownorg_H4hLIkm9.mp3"},
  {title:"Star",artist:"Paky feat. Shiva",src:"Sarabanda/star-feat-shiva-spotdownorg_GKes0eff.mp3"},
  {title:"Wop Wop",artist:"Nerissima Serpe feat. Shiva",src:"Sarabanda/wop-wop-feat-shiva-spotdownorg_ysKnIkjV.mp3"},
  {title:"Duomo",artist:"Rondo",src:"Sarabanda/duomo-spotdownorg_0xM5I9NX.mp3"},
  {title:"Mu Ammar Gheddafi",artist:"Kid Yugi feat. Simba La Rue",src:"Sarabanda/mu-ammar-gheddafi-feat-simba-la-rue-spotdownorg_RT8ye2pj.mp3"},
  {title:"Vrp",artist:"Simba la Rue",src:"Sarabanda/vrp-spotdownorg_LDQ6R2d5.mp3"},
  {title:"Kriminal",artist:"Baby Gang",src:"Sarabanda/kriminal-prod-by-roberto-ferrante-spotdownorg_UaY6SkYw.mp3"},
  {title:"Titi Me Pregunto",artist:"Bad Bunny",src:"Sarabanda/titi-me-pregunto-spotdownorg_eKPTgu8m.mp3"},
  {title:"Pura Purissima",artist:"PapaV feat. Nerissima Serpe",src:"Sarabanda/pura-purissima-feat-nerissima-serpe-spotdownorg_A14efeYT.mp3"},
  {title:"Lo So Che",artist:"Capo Plaza",src:"Sarabanda/lo-so-che-spotdownorg_OQrSe6FU.mp3"},
  {title:"Serpenti A Sonagli",artist:"Sfera Ebbasta",src:"Sarabanda/serpenti-a-sonagli-spotdownorg_2RlEGL2t.mp3"},
  {title:"Diego Armando Maradona",artist:"Dark Polo Gang",src:"Sarabanda/diego-armando-maradona-spotdownorg_YjnSVhZG.mp3"},
  {title:"Bullet Ballet",artist:"Kid Yugifeat. Artie 5ive",src:"Sarabanda/bullet-ballet-feat-artie-5ive-spotdownorg_udtb7zPG.mp3"},
  {title:"7eleven",artist:"Artie 5ive",src:"Sarabanda/7eleven-spotdownorg_96rBRsEg.mp3"},
  {title:"Berserker",artist:"Kid Yugi",src:"Sarabanda/berserker-spotdownorg_21oW21Ad.mp3"},
  {title:"Guarda Come Flexo",artist:"Mambolosco",src:"Sarabanda/guarda-come-flexo-spotdownorg_vHZd4xjM.mp3"},
  {title:"Gilgamesh",artist:"Kid Yugi",src:"Sarabanda/gilgamesh-spotdownorg_Sa9vkHAB.mp3"},
  {title:"Tranne Te",artist:"Fabri Fibra",src:"Sarabanda/tranne-te-spotdownorg_j8t5XIf4.mp3"},
  {title:"Rollercoaster",artist:"",src:"Sarabanda/rollercoaster-spotdownorg_I1JSCQQ1.mp3"},
  {title:"Dende",artist:"Ghali",src:"Sarabanda/dende-spotdownorg_4NO55bBS.mp3"},
  {title:"4k",artist:"",src:"Sarabanda/4k-spotdownorg_p27mFjnu.mp3"},
  {title:"Highest In The Room",artist:"Travis Scott",src:"Sarabanda/highest-in-the-room-spotdownorg_iqeLCYXa.mp3"},
  {title:"4 Gambe",artist:"Nerissima Serpe",src:"Sarabanda/4-gambe-spotdownorg_ahdpSiQy.mp3"},
  {title:"Cambiare Adesso",artist:"Dark Polo Gang",src:"Sarabanda/cambiare-adesso-spotdownorg_pKZLqjvg.mp3"},
  {title:"Sicko Mode",artist:"Travis Scott",src:"Sarabanda/sicko-mode-spotdownorg_LKj1Fu0c.mp3"},
  {title:"Spie",artist:"Shiva",src:"Sarabanda/spie-spotdownorg_nosI7WU5.mp3"},
  {title:"Sogno Americano",artist:"Artie 5ive",src:"Sarabanda/sogno-americano-spotdownorg_D8jDPuZH.mp3"},
  {title:"Apparecchiato",artist:"PapaV feat. Nerissima Serpe",src:"Sarabanda/apparecchiato-feat-nerissima-serpe-spotdownorg_UHztB2in.mp3"},
  {title:"Tuta Black",artist:"Paky feat. Shiva",src:"Sarabanda/tuta-black-spotdownorg_BLjCb5Df.mp3"},
  {title:"Cupido",artist:"Sfera Ebbasta",src:"Sarabanda/cupido-feat-quavo-spotdownorg_laJDpsUu.mp3"},
  {title:"Auto Tedesca",artist:"Paky",src:"Sarabanda/auto-tedesca-spotdownorg_nLKFBkge.mp3"},
  {title:"Sportswear",artist:"Dark Polo Gang",src:"Sarabanda/sportswear-spotdownorg_7pC8nc6q.mp3"},
  {title:"Nisida",artist:"Capo Plaza",src:"Sarabanda/nisida-spotdownorg_zvNUfiBE.mp3"},
  {title:"Rozzi",artist:"Paky",src:"Sarabanda/rozzi-spotdownorg_TKPb0hKz.mp3"},
  {title:"Assistente Sociale",artist:"Baby Gang feat. Simba La Rue",src:"Sarabanda/assistente-sociale-feat-simba-la-rue-spotdownorg_gSiDlMe6.mp3"},
  {title:"64 Barre In Faccia",artist:"Artie 5ive",src:"Sarabanda/64-barre-in-faccia-red-bull-64-bars-spotdownorg_PzuleJn6.mp3"},
  {title:"Davverodavvero",artist:"Artie 5ive",src:"Sarabanda/davverodavvero-spotdownorg_ggk0EC8Y.mp3"},
  {title:"Warzone",artist:"Capo Plaza",src:"Sarabanda/warzone-feat-artie-5ive-capo-plaza-nerissima-serpe-spotdownorg_YMIfakiN.mp3"},
  {title:"Chuck Norris",artist:"Kid Yugi",src:"Sarabanda/chuck-norris-feat-papa-v-rrari-dal-tacco-nerissima-serpe-spotdownorg_aL0dv8Hv.mp3"}
];

const GUESS_WHO_CHARACTERS=[
  {name:"Leonardo da Vinci",aliases:["Leonardo","Da Vinci"],category:"Arte e genio",clues:["Sono nato in Toscana nel Rinascimento.","Ho studiato arte, anatomia, macchine e volo.","Uno dei miei dipinti e conservato al Louvre.","Ho dipinto anche L'Ultima Cena.","La Gioconda e la mia opera piu famosa."]},
  {name:"Albert Einstein",aliases:["Einstein"],category:"Scienza",clues:["Sono nato in Germania.","Il mio nome e legato alla fisica moderna.","Avevo capelli bianchi molto riconoscibili.","Ho ricevuto il Nobel per la fisica.","La formula E=mc2 e associata a me."]},
  {name:"Cristiano Ronaldo",aliases:["Ronaldo","CR7","Cristiano"],category:"Sport",clues:["Sono un calciatore portoghese.","Ho giocato in Inghilterra, Spagna e Italia.","Il mio numero iconico e il 7.","Ho vinto piu Palloni d'Oro.","Sono conosciuto anche come CR7."]},
  {name:"Lionel Messi",aliases:["Messi","Leo Messi"],category:"Sport",clues:["Sono un calciatore argentino.","Sono cresciuto calcisticamente a Barcellona.","Ho vinto il Mondiale con la mia nazionale.","Il mio nome e spesso confrontato con Ronaldo.","Mi chiamano anche Leo."]},
  {name:"Taylor Swift",aliases:["Taylor","Swift"],category:"Musica",clues:["Sono una cantante statunitense.","Ho iniziato nel country e poi sono passata al pop.","I miei fan si chiamano Swifties.","Ho pubblicato album come 1989 e Midnights.","Il mio cognome significa veloce in inglese."]},
  {name:"Michael Jackson",aliases:["Jackson","MJ"],category:"Musica",clues:["Sono stato una star mondiale del pop.","Ho iniziato a cantare da bambino con i miei fratelli.","Il moonwalk e una mia mossa iconica.","Thriller e uno dei miei album piu famosi.","Sono conosciuto come il Re del Pop."]},
  {name:"Harry Potter",aliases:["Harry","Potter"],category:"Cinema e libri",clues:["Sono un personaggio di fantasia.","Ho una cicatrice molto riconoscibile sulla fronte.","Studio magia in una scuola speciale.","I miei amici piu stretti sono Ron ed Hermione.","Sono il protagonista della saga creata da J.K. Rowling."]},
  {name:"Super Mario",aliases:["Mario","Mario Bros"],category:"Videogiochi",clues:["Sono un personaggio dei videogiochi.","Indosso spesso salopette e cappello rosso.","Il mio mestiere e collegato ai tubi.","Mio fratello si chiama Luigi.","Sono la mascotte piu famosa di Nintendo."]},
  {name:"Elon Musk",aliases:["Musk","Elon"],category:"Tecnologia",clues:["Sono un imprenditore nato in Sudafrica.","Il mio nome e legato ad auto elettriche e razzi.","Ho guidato aziende come Tesla e SpaceX.","Ho acquistato una grande piattaforma social.","Il mio nome e Elon."]},
  {name:"Dua Lipa",aliases:["Dua","Lipa"],category:"Musica",clues:["Sono una cantante britannica.","Le mie origini familiari sono albanesi-kosovare.","Ho pubblicato hit pop e dance.","Future Nostalgia e uno dei miei album.","Il mio nome di battesimo e Dua."]},
  {name:"Marracash",aliases:["Marra","Fabio Bartolo Rizzo"],category:"Musica italiana",clues:["Sono un rapper italiano.","Sono nato a Nicosia e cresciuto a Milano.","Il mio vero nome e Fabio Bartolo Rizzo.","Ho pubblicato album come Persona.","Il mio nome d'arte richiama Marrakech."]},
  {name:"Sfera Ebbasta",aliases:["Sfera","Gionata Boschetti"],category:"Musica italiana",clues:["Sono un trapper italiano.","Vengo da Cinisello Balsamo.","Il mio vero nome e Gionata Boschetti.","Ho collaborato spesso con Charlie Charles.","Il mio nome d'arte contiene la parola Sfera."]},
  {name:"Mina",aliases:["Mina Mazzini"],category:"Musica italiana",clues:["Sono una cantante italiana leggendaria.","La mia voce e considerata tra le piu riconoscibili.","Da anni non appaio spesso in pubblico.","Sono chiamata anche la Tigre di Cremona.","Il mio nome artistico e formato da quattro lettere."]},
  {name:"Paolo Bonolis",aliases:["Bonolis"],category:"TV italiana",clues:["Sono un conduttore televisivo italiano.","Sono noto per ritmo, ironia e improvvisazione.","Ho condotto programmi Mediaset molto popolari.","Uno dei miei programmi e Avanti un Altro.","Il mio storico compagno di scena e Luca Laurenti."]},
  {name:"Gerry Scotti",aliases:["Scotti","Virginio Scotti"],category:"TV italiana",clues:["Sono un conduttore televisivo italiano.","La mia risata e molto riconoscibile.","Ho condotto quiz e talent in TV.","Sono legato a programmi come Chi vuol essere milionario.","Il mio nome d'arte e Gerry Scotti."]},
  {name:"Raffaella Carra",aliases:["Carra","Raffaella"],category:"TV e musica italiana",clues:["Sono stata cantante, ballerina e conduttrice.","Sono una icona dello spettacolo italiano.","Il caschetto biondo era parte del mio look.","Una mia canzone diceva Tuca Tuca.","Il mio nome e Raffaella Carra."]},
  {name:"Francesco Totti",aliases:["Totti","Er Pupone"],category:"Sport italiano",clues:["Sono un ex calciatore italiano.","Ho giocato quasi tutta la carriera nella stessa squadra.","Ho vinto il Mondiale nel 2006.","Sono un simbolo della Roma.","Il mio soprannome e Er Pupone."]},
  {name:"Federica Pellegrini",aliases:["Pellegrini","Divina"],category:"Sport italiano",clues:["Sono una campionessa italiana di nuoto.","La mia specialita e stata lo stile libero.","Ho vinto medaglie olimpiche e mondiali.","Sono soprannominata la Divina.","Il mio nome e Federica Pellegrini."]},
  {name:"Greta Thunberg",aliases:["Greta","Thunberg"],category:"Attualita",clues:["Sono un'attivista svedese.","Sono diventata famosa da adolescente.","Il mio tema principale e il clima.","Ho ispirato scioperi studenteschi globali.","Il mio nome e Greta Thunberg."]},
  {name:"Barack Obama",aliases:["Obama"],category:"Politica",clues:["Sono un politico statunitense.","Ho ricevuto il Premio Nobel per la pace.","Sono stato senatore dell'Illinois.","Sono stato presidente degli Stati Uniti.","Il mio cognome e Obama."]}
];

const WHEEL_SEGMENTS=[
  {label:"100",points:100},
  {label:"200",points:200},
  {label:"400",points:400},
  {label:"800",points:800},
  {label:"500",points:500},
  {label:"PASSA",points:0,pass:true},
  {label:"300",points:300},
  {label:"1000",points:1000},
  {label:"BANK",points:0,bankrupt:true},
  {label:"400",points:400},
  {label:"800",points:800},
  {label:"JOLLY",points:1200}
];


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function refreshTtsVoices(){
  if(!('speechSynthesis' in window))return;
  ttsVoices=window.speechSynthesis.getVoices();
  renderTtsVoiceOptions();
}
refreshTtsVoices();
if('speechSynthesis' in window){
  window.speechSynthesis.onvoiceschanged=refreshTtsVoices;
}
function scoreTtsVoice(voice){
  const name=voice.name.toLowerCase();
  const lang=(voice.lang||'').toLowerCase();
  let score=0;
  if(lang==='it-it')score+=80;
  else if(lang.startsWith('it'))score+=60;
  if(/premium|enhanced|neural|natural|google|microsoft|alice|elsa|isabella|silvia|paolo|luca/.test(name))score+=25;
  if(!voice.localService)score+=8;
  if(/compact/.test(name))score-=20;
  return score;
}
function getItalianVoice(){
  const chosen=ttsVoices.find(v=>v.voiceURI===ttsVoiceURI);
  if(chosen)return chosen;
  return [...ttsVoices]
    .filter(v=>(v.lang&&v.lang.toLowerCase().startsWith('it'))||/ital/i.test(v.name))
    .sort((a,b)=>scoreTtsVoice(b)-scoreTtsVoice(a))[0]||null;
}
function renderTtsVoiceOptions(){
  const sel=document.getElementById('tts-voice');
  if(!sel)return;
  const italianVoices=ttsVoices
    .filter(v=>(v.lang&&v.lang.toLowerCase().startsWith('it'))||/ital/i.test(v.name))
    .sort((a,b)=>scoreTtsVoice(b)-scoreTtsVoice(a));
  sel.innerHTML='';
  const autoOpt=document.createElement('option');
  autoOpt.value='';
  autoOpt.textContent='Automatica';
  sel.appendChild(autoOpt);
  italianVoices.forEach(v=>{
    const opt=document.createElement('option');
    opt.value=v.voiceURI;
    opt.textContent=`${v.name} (${v.lang})`;
    opt.selected=v.voiceURI===ttsVoiceURI;
    sel.appendChild(opt);
  });
}
function setTtsVoice(uri){
  ttsVoiceURI=uri;
  localStorage.setItem('tvgn-tts-voice',uri);
  stopQuestionSpeech();
}
function setTtsRate(value){
  ttsRate=parseFloat(value)||.9;
  localStorage.setItem('tvgn-tts-rate',ttsRate);
  const val=document.getElementById('tts-rate-val');
  if(val)val.textContent=ttsRate.toFixed(2)+'x';
}
function stopQuestionSpeech(){
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
}
function speakQuestion(text){
  if(!('speechSynthesis' in window)||!text)return;
  stopQuestionSpeech();
  const msg=new SpeechSynthesisUtterance(text);
  msg.lang='it-IT';
  msg.rate=ttsRate;
  msg.pitch=.92;
  msg.volume=1;
  const voice=getItalianVoice();
  if(voice)msg.voice=voice;
  window.speechSynthesis.speak(msg);
}

function goTo(id,options={}){
  const pushRoute=options.pushRoute!==false;
  if(id!=='s-aua'&&id!=='s-eredita')stopQuestionSpeech();
  if(id!=='s-aua'&&id!=='s-pick')stopAuaAudio();
  if(id!=='s-pick-wheel'&&id!=='s-wheel')stopRdfAudio();
  if(id!=='s-chain')clearChainTimer();
  if(id!=='s-sarabanda')stopSarabandaAudio();
  if(id!=='s-affari')stopAffariAudio();
  if(id!=='s-ghigliottina'&&id!=='s-pick-ghigliottina'){
    clearGhigliottinaTimer();
    stopGhigliottinaAudio();
  }
  if(id!=='s-higherlower'){
    clearTimeout(higherLowerTimer);
    higherLowerTimer=null;
  }
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id==='s-win'){
    startWinFinale();
  } else {
    clearWinFinale();
  }
  if(id==='s-setup'){
    initTtsControls();
    renderPlayers();
    renderTeamSection();
    renderRegisteredUserSelect();
  }
  updatePresenceState({currentScreen:id,currentGame:getGameNameFromScreen(id)});
  if(pushRoute&&appRoutingReady&&APP_ROUTES[id]&&location.pathname!==APP_ROUTES[id]){
    history.pushState({screen:id},'',APP_ROUTES[id]);
  }
}
function initials(n){return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[ch]));
}
function playerColor(player, fallbackIndex=0){
  const ci=Number(player?.ci);
  const idx=Number.isFinite(ci)?ci:fallbackIndex;
  return TC[((idx%TC.length)+TC.length)%TC.length]||TC[0];
}

let winFinaleTimers=[];
function clearWinFinale(){
  winFinaleTimers.forEach(timer=>clearTimeout(timer));
  winFinaleTimers=[];
}

function getWinPodiumEntries(){
  const rows=Array.from(document.querySelectorAll('#win-scores .sc-row')).slice(0,3);
  const rowEntries=rows.map((row,idx)=>{
    const name=row.querySelector('.sc-name')?.textContent?.trim()||'Giocatore';
    const score=row.querySelector('.sc-pts')?.textContent?.trim()||'0';
    return {
      name,
      score,
      rank:idx+1,
      color:TC[idx%TC.length],
      initials:initials(name)
    };
  }).filter(entry=>entry.name&&entry.name!=='—');

  const playerEntries=[...players]
    .sort((a,b)=>(b.score||0)-(a.score||0))
    .slice(0,3)
    .map((player,idx)=>({
      name:player.name||'Giocatore',
      score:player.score||0,
      rank:idx+1,
      color:playerColor(player,idx),
      initials:initials(player.name||'G')
    }));

  return playerEntries.length ? playerEntries : rowEntries;
}

function normalizeWinPodiumEntries(entries){
  const normalized=[...entries].slice(0,3);
  while(normalized.length<3){
    normalized.push({
      name:'',
      score:'',
      rank:normalized.length+1,
      color:TC[normalized.length%TC.length],
      initials:'—',
      empty:true
    });
  }
  return normalized.map((entry,idx)=>({
    ...entry,
    rank:idx+1,
    color:entry.color||TC[idx%TC.length]||TC[0],
    initials:entry.initials||initials(entry.name||'—')
  }));
}

function formatPodiumScore(score){
  const text=String(score??'').trim();
  if(!text)return '—';
  return /pt|€|eur/i.test(text)?escapeHtml(text):`${escapeHtml(text)} pt`;
}

function podiumSlotHtml(entry,slotClass){
  const medal={1:'1',2:'2',3:'3'}[entry.rank]||entry.rank;
  const c=entry.color||TC[0];
  return `<div class="podium-slot ${slotClass}${entry.empty?' empty':''}" data-rank="${entry.rank}">
    <div class="podium-avatar" style="background:${c.light};color:${c.hex}">${escapeHtml(entry.empty?'—':entry.initials)}</div>
    <div class="podium-name">${escapeHtml(entry.empty?'':entry.name)}</div>
    <div class="podium-score">${entry.empty?'—':formatPodiumScore(entry.score)}</div>
    <div class="podium-block">${medal}</div>
  </div>`;
}

function renderWinPodium(entries){
  const podium=document.getElementById('win-podium');
  if(!podium)return;
  podium.className='win-podium';
  const [first,second,third]=normalizeWinPodiumEntries(entries);
  podium.innerHTML=podiumSlotHtml(second,'second')+podiumSlotHtml(first,'first')+podiumSlotHtml(third,'third');
}

function startWinFinale(){
  clearWinFinale();
  const wrap=document.querySelector('#s-win .win-wrap');
  const title=document.getElementById('win-title');
  const name=document.getElementById('win-name');
  const sub=document.getElementById('win-sub');
  const suspense=document.getElementById('win-suspense');
  const entries=getWinPodiumEntries();
  const winnerName=(name?.textContent||entries[0]?.name||'Giocatore').trim();
  const winnerSub=(sub?.textContent||'').trim();
  renderWinPodium(entries);

  if(title)title.textContent='PODIO FINALE';
  if(name)name.textContent=winnerName||'—';
  if(sub)sub.textContent=winnerSub;
  suspense?.classList.add('hidden');
  wrap?.classList.remove('revealing');
  wrap?.classList.add('ready');
}
function getTimer(g){return parseInt(document.getElementById('timer-'+g).value)||30}
function getTabooTimer(){return parseInt(document.getElementById('timer-taboo')?.value)||60}
function initAppRouting(){
  if(appRoutingReady)return;
  appRoutingReady=true;
  const initialScreen=SCREEN_BY_ROUTE[location.pathname]||'s-hero';
  if(location.pathname==='/home')history.replaceState({screen:'s-hero'},'',APP_ROUTES['s-hero']);
  goTo(initialScreen,{pushRoute:false});
  window.addEventListener('popstate',()=>{
    const screen=SCREEN_BY_ROUTE[location.pathname]||'s-hero';
    goTo(screen,{pushRoute:false});
  });
}
function getGameNameFromScreen(id){
  if(['s-hero','s-setup','s-pick','s-pick2','s-pick-wheel','s-pick-chain','s-pick-taboo','s-pick-hol','s-pick-affari','s-pick-movie','s-pick-ghigliottina','s-win'].includes(id))return 'menu';
  if(id==='s-aua')return 'aua';
  if(id==='s-eredita')return 'eredita';
  if(id==='s-wheel')return 'ruota';
  if(id==='s-chain')return 'catena';
  if(id==='s-sarabanda')return 'sarabanda';
  if(id==='s-guesswho')return 'guesswho';
  if(id==='s-higherlower')return 'higherlower';
  if(id==='s-affari')return 'affarituoi';
  if(id==='s-movieguess')return 'movieguess';
  if(id==='s-ghigliottina')return 'ghigliottina';
  if(id==='s-intesa-score')return 'intesa';
  return 'menu';
}
function initTtsControls(){
  const rate=document.getElementById('tts-rate');
  if(rate)rate.value=ttsRate;
  setTtsRate(ttsRate);
  renderTtsVoiceOptions();
}

function setAuaAudio(){
  if(!auaAudio){auaAudio=document.getElementById('aua-audio');}
}
function setAuaErrorAudio(){
  if(!auaErrorAudio){auaErrorAudio=document.getElementById('aua-error-audio');}
}
function showAuaIntroEffects(){
  const el=document.getElementById('aua-intro-effects');
  if(el){el.classList.add('active');}
}
function hideAuaIntroEffects(){
  const el=document.getElementById('aua-intro-effects');
  if(el){el.classList.remove('active');}
}
function showWheelIntroEffects(){
  const el=document.getElementById('wheel-intro-effects');
  if(el){el.classList.add('active');}
}
function hideWheelIntroEffects(){
  const el=document.getElementById('wheel-intro-effects');
  if(el){el.classList.remove('active');}
}
function clearAuaAutoStart(){
  if(auaAudio && auaAutoStartListener){
    auaAudio.removeEventListener('timeupdate',auaAutoStartListener);
    auaAutoStartListener=null;
  }
}
function playAuaErrorSound(){
  setAuaAudio();
  setAuaErrorAudio();
  if(!auaErrorAudio) return;
  if(auaAudio && !auaAudio.paused){
    auaThemeResumeTime = auaAudio.currentTime;
    auaAudio.pause();
  }
  auaErrorAudio.currentTime = 0;
  auaErrorAudio.play().catch(()=>{});
  auaErrorAudio.onended = () => {
    if(auaAudio){
      auaAudio.currentTime = auaThemeResumeTime;
      auaAudio.play().catch(()=>{});
    }
  };
}
function startAuaIntro(){
  setAuaAudio();
  if(!auaAudio) return;
  clearAuaAutoStart();
  showAuaIntroEffects();
  auaAutoStarted=false;
  auaAudio.currentTime=0;
  auaAudio.play().catch(()=>{});
  auaAutoStartListener=function(){
    if(auaAutoStarted) return;
    if(auaAudio.currentTime>=14){
      auaAutoStarted=true;
      clearAuaAutoStart();
      if(!selPid){
        selPid=players.length?players[0].id:null;
        if(selPid){
          document.getElementById('pp1-'+selPid)?.classList.add('selected');
          document.getElementById('btn-pick-go').disabled=false;
        }
      }
      if(selPid){
        beginAUA();
      }
    }
  };
  auaAudio.addEventListener('timeupdate',auaAutoStartListener);
}
function stopAuaAudio(){
  setAuaAudio();
  setAuaErrorAudio();
  clearInterval(auaInt);
  if(!auaAudio) return;
  clearAuaAutoStart();
  auaAudio.pause();
  auaAudio.currentTime=0;
  if(auaErrorAudio){
    auaErrorAudio.pause();
    auaErrorAudio.currentTime = 0;
  }
}
function setRdfAudio(){
  if(!rdfAudio){rdfAudio=document.getElementById('rdf-audio');}
}
function clearRdfAutoStart(){
  if(rdfAudio&&rdfAutoStartListener){
    rdfAudio.removeEventListener('timeupdate',rdfAutoStartListener);
    rdfAutoStartListener=null;
  }
}
function startRdfAudioAuto(){
  setRdfAudio();
  if(!rdfAudio)return;
  clearRdfAutoStart();
  showWheelIntroEffects();
  rdfAutoStarted=false;
  rdfAudio.currentTime=0;
  rdfAudio.play().catch(()=>{});
  rdfAutoStartListener=function(){
    if(rdfAutoStarted)return;
    if(rdfAudio.currentTime>=12){
      rdfAutoStarted=true;
      clearRdfAutoStart();
      if(!selWheelPid&&players.length){
        selWheelPid=players[0].id;
        document.getElementById('pp-wheel-'+selWheelPid)?.classList.add('selected');
      }
      beginWheel();
    }
  };
  rdfAudio.addEventListener('timeupdate',rdfAutoStartListener);
}
function stopRdfAudio(){
  setRdfAudio();
  hideWheelIntroEffects();
  clearRdfAutoStart();
  if(rdfAudio){
    rdfAudio.pause();
    rdfAudio.currentTime=0;
  }
  const overlay=document.getElementById('wheel-video-overlay');
  const video=document.getElementById('wheel-intro-video');
  if(video){
    if(wheelIntroFinishHandler){
      video.removeEventListener('ended',wheelIntroFinishHandler);
      video.removeEventListener('error',wheelIntroFinishHandler);
      wheelIntroFinishHandler=null;
    }
    video.pause();
    try{video.currentTime=0;}catch(err){}
  }
  if(overlay){
    overlay.classList.remove('active','visible');
  }
  if(document.fullscreenElement&&document.exitFullscreen){
    document.exitFullscreen().catch(()=>{});
  }
  wheelIntroVideoPlaying=false;
}

function startWheelIntroVideo(){
  if(!selWheelPid)return;
  stopRdfAudio();
  const overlay=document.getElementById('wheel-video-overlay');
  const video=document.getElementById('wheel-intro-video');
  if(!overlay||!video){
    beginWheel();
    return;
  }
  wheelIntroVideoPlaying=true;
  overlay.classList.add('active');
  requestAnimationFrame(()=>overlay.classList.add('visible'));
  if(overlay.requestFullscreen&&!document.fullscreenElement){
    overlay.requestFullscreen().catch(()=>{});
  }
  video.currentTime=0;
  video.muted=false;
  if(wheelIntroFinishHandler){
    video.removeEventListener('ended',wheelIntroFinishHandler);
    video.removeEventListener('error',wheelIntroFinishHandler);
  }
  wheelIntroFinishHandler=()=>finishWheelIntroVideo();
  video.addEventListener('ended',wheelIntroFinishHandler);
  video.addEventListener('error',wheelIntroFinishHandler);
  const attempt=video.play();
  if(attempt&&attempt.catch){
    attempt.catch(()=>finishWheelIntroVideo());
  }
}

function finishWheelIntroVideo(){
  if(!wheelIntroVideoPlaying)return;
  wheelIntroVideoPlaying=false;
  const overlay=document.getElementById('wheel-video-overlay');
  const video=document.getElementById('wheel-intro-video');
  if(video){
    if(wheelIntroFinishHandler){
      video.removeEventListener('ended',wheelIntroFinishHandler);
      video.removeEventListener('error',wheelIntroFinishHandler);
      wheelIntroFinishHandler=null;
    }
    video.pause();
    try{video.currentTime=0;}catch(err){}
  }
  if(overlay){
    overlay.classList.remove('visible');
    setTimeout(()=>overlay.classList.remove('active'),700);
  }
  if(document.fullscreenElement&&document.exitFullscreen){
    document.exitFullscreen().catch(()=>{});
  }
  beginWheel();
}

async function beginIntesa(options={}){
  activeStatsGame='intesa';
  if(!selP1||!selP2||selP1===selP2) return;
  if(options.sessionId)listenGameSession(options.sessionId);
  intesaPlayers={p1:selP1,p2:selP2};
  const p1=players.find(p=>p.id===selP1);
  const p2=players.find(p=>p.id===selP2);
  if(!p1||!p2) return;
  if(!options.fromInvite&&selectedPlayMode==='online'){
    const sessionId=await createGameSession('intesa',{
      p1Uid:p1.uid||null,
      p2Uid:p2.uid||null,
      p1Name:p1.name,
      p2Name:p2.name,
      status:'scoring'
    });
    sendGameInvites('intesa',{p1Uid:p1.uid||null,p2Uid:p2.uid||null,sessionId});
  }
  document.getElementById('intesa-p1-input').innerHTML=`<span style="flex:1;font-weight:800">${p1.name}</span><input class="tf" id="intesa-p1-score" type="number" min="0" value="0" style="width:80px">`;
  document.getElementById('intesa-p2-input').innerHTML=`<span style="flex:1;font-weight:800">${p2.name}</span><input class="tf" id="intesa-p2-score" type="number" min="0" value="0" style="width:80px">`;
  window.open('https://www.ed0.it/games/intesavincente/','_blank');
  goTo('s-intesa-score');
}

function saveIntesaScores(){
  const v1=parseInt(document.getElementById('intesa-p1-score')?.value)||0;
  const v2=parseInt(document.getElementById('intesa-p2-score')?.value)||0;
  const p1=players.find(p=>p.id===intesaPlayers.p1);
  const p2=players.find(p=>p.id===intesaPlayers.p2);
  awardPlayerPoints(intesaPlayers.p1,v1,'intesa');
  awardPlayerPoints(intesaPlayers.p2,v2,'intesa');
  const winnerUids=[];
  if(v1>v2&&p1?.uid)winnerUids.push(p1.uid);
  if(v2>v1&&p2?.uid)winnerUids.push(p2.uid);
  if(v1===v2)[p1?.uid,p2?.uid].filter(Boolean).forEach(uid=>winnerUids.push(uid));
  recordCompletedGame('intesa',winnerUids);
  intesaPlayers={p1:null,p2:null};
  renderPlayers();
  renderTeamSection();
  renderHomeLeaderboard();
  cleanupOnlineGameArtifacts();
  
  goTo('s-hero');
}

/* ── PLAYER/TEAM MANAGEMENT ── */
function addPlayer(){
  const inp=document.getElementById('inp-player');
  const name=inp.value.trim();
  if(!name||players.find(p=>p.name.toLowerCase()===name.toLowerCase()))return;
  players.push({id:nPid++,name,teamId:null,score:0,ci:players.length%TC.length,uid:null});
  inp.value='';inp.focus();
  renderPlayers();renderTeamSection();
}
function addRegisteredPlayer(){
  const select=document.getElementById('registered-player-select');
  const uid=select?.value;
  if(!uid)return;
  const user=registeredUsers.find(u=>u.uid===uid||u.id===uid);
  if(!user||players.some(p=>p.uid===uid))return;
  players.push({
    id:nPid++,
    name:user.name||`Anonimo ${uid.slice(0,4).toUpperCase()}`,
    teamId:null,
    score:0,
    ci:players.length%TC.length,
    uid,
    isAnonymous:!!user.isAnonymous,
    photoURL:user.photoURL||null
  });
  select.value='';
  renderPlayers();
  renderTeamSection();
  renderRegisteredUserSelect();
}
function removePlayer(id){
  players=players.filter(p=>p.id!==id);
  teams.forEach(t=>{t.mids=t.mids.filter(m=>m!==id)});
  renderPlayers();renderTeamSection();renderRegisteredUserSelect();
}
function renderPlayers(){
  const el=document.getElementById('list-players');
  if(!players.length){el.innerHTML='<div class="empty">Nessun giocatore ancora</div>';renderHomeLeaderboard();return;}
  el.innerHTML=players.map(p=>{
    const t=teams.find(t=>t.mids.includes(p.id));
    const c=TC[p.ci%TC.length];
    const tag=t?`<span class="chip-tag" style="background:${t.color.light};color:${t.color.hex}">${escapeHtml(t.name)}</span>`:'';
    const onlineTag=p.uid?`<span class="chip-tag" style="background:rgba(46,204,113,.14);color:#2ECC71">Firestore</span>`:'';
    return `<div class="chip"><div class="chip-left">
      <div class="avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
      <span class="chip-name">${escapeHtml(p.name)}</span>${onlineTag}${tag}
    </div><button class="btn-rm" onclick="removePlayer(${p.id})">✕</button></div>`;
  }).join('');
  renderHomeLeaderboard();
}
function renderRegisteredUserSelect(){
  const select=document.getElementById('registered-player-select');
  if(!select)return;
  const available=registeredUsers
    .filter(u=>!players.some(p=>p.uid===(u.uid||u.id)))
    .sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(!currentUser){
    select.innerHTML='<option value="">Accedi per caricare profili</option>';
    return;
  }
  if(!available.length){
    select.innerHTML='<option value="">Nessun altro profilo disponibile</option>';
    return;
  }
  select.innerHTML='<option value="">Aggiungi giocatore registrato...</option>'+
    available.map(u=>`<option value="${escapeHtml(u.uid||u.id)}">${escapeHtml(u.name||'Anonimo')}${u.isAnonymous?' (anonimo)':''}</option>`).join('');
}
function addTeam(){
  const inp=document.getElementById('inp-team')||document.querySelector('[data-team-input]');if(!inp)return;
  const name=inp.value.trim()||`Squadra ${teams.length+1}`;
  teams.push({id:nTid++,name,color:TC[teams.length%TC.length],mids:[],score:0});
  inp.value='';renderTeamSection();renderPlayers();
}
function removeTeam(id){teams=teams.filter(t=>t.id!==id);renderTeamSection();renderPlayers();}
function assignPlayer(pid,tidStr){
  const tid=parseInt(tidStr);
  teams.forEach(t=>{t.mids=t.mids.filter(id=>id!==pid)});
  if(tid){const t=teams.find(t=>t.id===tid);if(t)t.mids.push(pid);}
  renderTeamSection();renderPlayers();
}
function renderTeamSection(){
  const el=document.getElementById('team-section');
  if(players.length<2){el.innerHTML='<div class="empty">Aggiungi almeno 2 giocatori</div>';return;}
  const addRow=teams.length<5?`<div class="field-row" style="margin-bottom:.7rem">
    <input class="tf" id="inp-team" data-team-input="true" placeholder="Nome squadra..." maxlength="18" onkeydown="if(event.key==='Enter')addTeam()">
    <button class="btn-add" type="button" onclick="addTeam()">＋</button></div>`:'';
  const tHtml=teams.map(t=>`<div class="chip" style="margin-bottom:.35rem;border-left:3px solid ${t.color.hex};border-radius:0 9px 9px 0">
    <div class="chip-left"><span class="chip-name" style="color:${t.color.hex}">${escapeHtml(t.name)}</span>
    <span style="font-size:.72rem;color:var(--mut);margin-left:.4rem">${escapeHtml(players.filter(p=>t.mids.includes(p.id)).map(m=>m.name).join(', ')||'(vuota)')}</span></div>
    <button class="btn-rm" type="button" onclick="removeTeam(${t.id})">✕</button></div>`).join('');
  const assignHtml=teams.length?`<div style="margin-top:.8rem;font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.5rem">Assegna</div>
    ${players.map(p=>{const cur=teams.find(t=>t.mids.includes(p.id));
    return `<div class="field-row" style="margin-bottom:.35rem">
      <span style="flex:1;font-size:.86rem;font-weight:800;display:flex;align-items:center">${escapeHtml(p.name)}</span>
      <select class="tf" style="flex:1" onchange="assignPlayer(${p.id},this.value)">
        <option value="">— Libero —</option>
        ${teams.map(t=>`<option value="${t.id}"${cur&&cur.id===t.id?' selected':''}>${escapeHtml(t.name)}</option>`).join('')}
      </select></div>`;}).join('')}`:'';
  el.innerHTML=addRow+tHtml+assignHtml;
  renderHomeLeaderboard();
}

window.addTeam=addTeam;
window.removeTeam=removeTeam;
window.assignPlayer=assignPlayer;

function renderHomeLeaderboard(){
  const el=document.getElementById('home-leaderboard');
  if(!el){return;}
  const sortedPlayers=[...players].sort((a,b)=>b.score-a.score).slice(0,3);
  const sortedTeams=[...teams].sort((a,b)=>b.score-a.score).slice(0,3);
  if(!sortedPlayers.length&&!sortedTeams.length&&!globalLeaderboard.length){el.innerHTML='';return;}
  let html='<div style="font-size:.78rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.8rem">Classifica punti</div>';
  if(sortedPlayers.length){
    html+='<div style="margin-bottom:.85rem"><strong style="display:block;margin-bottom:.35rem;color:#fff">Giocatori</strong>';
    html+=sortedPlayers.map((p,i)=>`<div class="sc-row">
      <div class="sc-rank">${i+1}</div>
      <div class="sc-name">${escapeHtml(p.name)}</div>
      <div class="sc-pts">${p.score}</div>
    </div>`).join('');
    html+='</div>';
  }
  if(globalLeaderboard.length){
    html+='<div style="margin-bottom:.85rem"><strong style="display:block;margin-bottom:.35rem;color:#fff">Online</strong>';
    html+=globalLeaderboard.map((u,i)=>`<div class="sc-row">
      <div class="sc-rank">${i+1}</div>
      <div class="sc-name">${escapeHtml(u.name)}${u.isAnonymous?' <span style="font-size:.68rem;color:var(--mut)">(anonimo)</span>':''}</div>
      <div class="sc-pts">${u.totalScore||0}</div>
    </div>`).join('');
    html+='</div>';
  }
  if(sortedTeams.length){
    html+='<div><strong style="display:block;margin-bottom:.35rem;color:#fff">Squadre</strong>';
    html+=sortedTeams.map((t,i)=>`<div class="sc-row">
      <div class="sc-rank">${i+1}</div>
      <div class="sc-name">${escapeHtml(t.name)}</div>
      <div class="sc-pts">${t.score}</div>
    </div>`).join('');
    html+='</div>';
  }
  el.innerHTML=html;
  
}

function awardPlayerPoints(pid,points=1,source='game',scoreTeam=true){
  const value=Number(points)||0;
  if(!pid||!value)return;
  const p=players.find(pl=>pl.id===pid);
  if(!p)return;
  p.score+=value;
  const t=scoreTeam?teams.find(tm=>tm.mids.includes(pid)):null;
  if(t)t.score+=value;
  savePlayerScoreOnline(p,value,source);
}

function getUserDisplayName(user){
  if(!user)return 'Anonimo';
  if(user.displayName)return user.displayName;
  if(user.email)return user.email.split('@')[0];
  return user.uid?`Anonimo ${user.uid.slice(0,4).toUpperCase()}`:'Anonimo';
}

function getProfileDisplayName(profile={},user=currentUser){
  if(profile.nickname)return profile.nickname.startsWith('@')?profile.nickname:`@${profile.nickname}`;
  const fullName=[profile.firstName,profile.lastName].filter(Boolean).join(' ').trim();
  return fullName||profile.name||getUserDisplayName(user);
}

function getProfileFullName(profile={},user=currentUser){
  return [profile.firstName,profile.lastName].filter(Boolean).join(' ').trim()||profile.name||getUserDisplayName(user);
}

function getProfileColor(profile={},displayName='TV'){
  const seed=String(profile.uid||profile.id||profile.name||displayName||'TV');
  let hash=0;
  for(let i=0;i<seed.length;i++)hash=(hash*31+seed.charCodeAt(i))>>>0;
  return PROFILE_COLORS[hash%PROFILE_COLORS.length];
}

function renderProfileAvatar(profile={},name='Utente',className='friend-avatar'){
  const color=getProfileColor(profile,name);
  return `<div class="${className}" style="background:${escapeHtml(color.bg)};color:${escapeHtml(color.color||'#fff')}">${escapeHtml(initials(name.replace(/^@/,'')||'TV')||'TV')}</div>`;
}

function getProfileStats(profile={},leaderboard={}){
  const stats={...DEFAULT_PROFILE_STATS,...(profile.stats||{})};
  return {
    gamesPlayed:Number(stats.gamesPlayed)||0,
    wins:Number(stats.wins)||0,
    lastGame:stats.lastGame||'—',
    totalScore:leaderboard.totalScore ?? profile.totalScore ?? 0
  };
}

function getGameStatsLabel(game){
  const labels={
    aua:'Avanti un Altro',
    eredita:"L'Eredita",
    intesa:"L'Intesa Vincente",
    ruota:'La Ruota',
    catena:'Reazione a Catena',
    sarabanda:'Sarabanda',
    guesswho:'Indovina Chi',
    higherlower:'Higher or Lower',
    taboo:'Taboo',
    affarituoi:'Affari Tuoi',
    movieguess:'Indovina il Film',
    ghigliottina:'La Ghigliottina'
  };
  return labels[game]||game||'—';
}

function addCurrentUserAsPlayer(user=currentUser){
  if(!user)return;
  const name=getUserDisplayName(user);
  const existing=players.find(p=>p.uid===user.uid);
  if(existing){
    existing.name=name;
    existing.isAnonymous=!!user.isAnonymous;
    existing.photoURL=user.photoURL||null;
    renderPlayers();
    renderTeamSection();
    renderRegisteredUserSelect();
    return;
  }
  players.push({
    id:nPid++,
    name,
    teamId:null,
    score:0,
    ci:players.length%TC.length,
    uid:user.uid,
    isAnonymous:!!user.isAnonymous,
    photoURL:user.photoURL||null
  });
  renderPlayers();
  renderTeamSection();
  renderRegisteredUserSelect();
}

function savePlayerScoreOnline(player,points,source='game'){
  if(!player?.uid||!currentUser||!window.db)return;
  const value=Number(points)||0;
  if(!value)return;
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const inc=firebase.firestore.FieldValue.increment(value);
  const userData={
    name:player.name||'Anonimo',
    isAnonymous:!!player.isAnonymous,
    photoURL:player.photoURL||null,
    updatedAt:now
  };
  const targetUid=player.uid;
  const batch=db.batch();
  batch.set(db.collection('users').doc(targetUid),{
    ...userData,
    totalScore:inc
  },{merge:true});
  batch.set(db.collection('leaderboard').doc(targetUid),{
    ...userData,
    totalScore:inc
  },{merge:true});
  batch.commit().catch(err=>console.error('Errore salvataggio punti Firestore:',err));
}

function recordGameStats(game,winnerUids=[]){
  if(!game||!window.db)return;
  const participantUids=[...new Set(players.map(p=>p.uid).filter(Boolean))];
  if(!participantUids.length)return;
  const winners=new Set([].concat(winnerUids||[]).filter(Boolean));
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const batch=db.batch();
  participantUids.forEach(uid=>{
    const stats={
      gamesPlayed:firebase.firestore.FieldValue.increment(1),
      lastGame:getGameStatsLabel(game)
    };
    if(winners.has(uid))stats.wins=firebase.firestore.FieldValue.increment(1);
    batch.set(db.collection('users').doc(uid),{stats,updatedAt:now},{merge:true});
  });
  batch.commit().catch(err=>console.error('Errore aggiornamento statistiche:',err));
}

function recordCompletedGame(game=activeStatsGame,winnerUids=[]){
  recordGameStats(game,winnerUids);
  if(game&&activeStatsGame===game)activeStatsGame=null;
}

function renderOnboardingStep(){
  const step=ONBOARDING_STEPS[onboardingStep]||ONBOARDING_STEPS[0];
  const icon=document.getElementById('tutorialIcon');
  const mini=document.getElementById('tutorialMiniTitle');
  const title=document.getElementById('tutorialTitle');
  const text=document.getElementById('tutorialText');
  const progress=document.getElementById('tutorialProgress');
  const back=document.getElementById('tutorialBack');
  const next=document.getElementById('tutorialNext');
  if(icon)icon.textContent=step.icon;
  if(mini)mini.textContent=step.mini;
  if(title)title.textContent=step.title;
  if(text)text.textContent=step.text;
  if(progress){
    progress.innerHTML=ONBOARDING_STEPS.map((_,idx)=>`<span class="${idx===onboardingStep?'active':''}"></span>`).join('');
  }
  if(back)back.disabled=onboardingStep===0;
  if(next)next.textContent=onboardingStep===ONBOARDING_STEPS.length-1?'Inizia':'Avanti';
}

function showOnboardingTutorial(){
  if(onboardingStarted)return;
  const overlay=document.getElementById('tutorialOverlay');
  if(!overlay)return;
  onboardingStarted=true;
  onboardingStep=0;
  renderOnboardingStep();
  overlay.classList.remove('hidden');
  overlay.style.display='flex';
}

function markOnboardingSeen(){
  if(!currentUser||!window.db)return;
  db.collection('users').doc(currentUser.uid).set({
    onboardingSeenAt:firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  },{merge:true}).catch(err=>console.error('Errore salvataggio tutorial:',err));
}

function closeOnboardingTutorial(){
  const overlay=document.getElementById('tutorialOverlay');
  if(overlay){
    overlay.classList.add('hidden');
    overlay.style.display='none';
  }
  markOnboardingSeen();
}

function skipOnboardingTutorial(){
  closeOnboardingTutorial();
}

function nextOnboardingStep(){
  if(onboardingStep>=ONBOARDING_STEPS.length-1){
    closeOnboardingTutorial();
    return;
  }
  onboardingStep+=1;
  renderOnboardingStep();
}

function prevOnboardingStep(){
  onboardingStep=Math.max(0,onboardingStep-1);
  renderOnboardingStep();
}

function isFreshFirebaseAuthUser(user){
  if(!user?.metadata)return false;
  return user.metadata.creationTime&&user.metadata.lastSignInTime&&user.metadata.creationTime===user.metadata.lastSignInTime;
}

function clearAnonymousCleanupTimer(){
  if(anonymousCleanupTimer)clearTimeout(anonymousCleanupTimer);
  anonymousCleanupTimer=null;
}

function resetAnonymousActivityTimer(){
  if(!currentUser?.isAnonymous||anonymousCleanupInProgress)return;
  clearAnonymousCleanupTimer();
  anonymousCleanupTimer=setTimeout(()=>{
    cleanupAnonymousAccount('idle-timeout');
  },ANON_IDLE_LIMIT_MS);
}

function bindAnonymousActivityListeners(){
  if(anonymousLifecycleBound)return;
  anonymousLifecycleBound=true;
  ['pointerdown','keydown','touchstart','scroll'].forEach(eventName=>{
    window.addEventListener(eventName,resetAnonymousActivityTimer,{passive:true});
  });
  window.addEventListener('pagehide',cleanupAnonymousAccountOnExit);
  window.addEventListener('beforeunload',cleanupAnonymousAccountOnExit);
}

function startAnonymousLifecycle(){
  bindAnonymousActivityListeners();
  resetAnonymousActivityTimer();
}

function stopAnonymousLifecycle(){
  clearAnonymousCleanupTimer();
}

function cleanupAnonymousAccountOnExit(){
  if(!currentUser?.isAnonymous||anonymousCleanupInProgress)return;
  cleanupAnonymousAccount('page-exit');
}

async function deleteAnonymousFirestoreData(uid){
  if(!uid||!window.db)return;
  const batch=db.batch();
  try{
    const invitesSnap=await db.collection('users').doc(uid).collection('gameInvites').limit(100).get();
    invitesSnap.docs.forEach(doc=>batch.delete(doc.ref));
  }catch(err){
    console.error('Errore lettura inviti anonimi:',err);
  }
  try{
    const sessionsSnap=await db.collection('gameSessions').where('createdBy','==',uid).limit(25).get();
    sessionsSnap.docs.forEach(doc=>batch.delete(doc.ref));
  }catch(err){
    console.error('Errore lettura sessioni anonime:',err);
  }
  batch.delete(db.collection('leaderboard').doc(uid));
  batch.delete(db.collection('users').doc(uid));
  await batch.commit();
}

async function cleanupAnonymousAccount(reason='manual',options={}){
  const user=currentUser||auth.currentUser;
  if(!user?.isAnonymous||anonymousCleanupInProgress)return;
  anonymousCleanupInProgress=true;
  stopAnonymousLifecycle();
  try{
    stopSarabandaAudio();
    stopGameSessionListener();
    if(database){
      await database.ref(`status/${user.uid}`).remove().catch(err=>console.error('Errore rimozione presenza anonima:',err));
    }
    await deleteAnonymousFirestoreData(user.uid);
    players=players.filter(p=>p.uid!==user.uid);
    renderPlayers();
    renderTeamSection();
    renderRegisteredUserSelect();
    if(options.deleteAuth!==false&&auth.currentUser?.uid===user.uid){
      await user.delete();
    }else if(options.signOut!==false&&auth.currentUser?.uid===user.uid){
      await auth.signOut();
    }
  }catch(err){
    console.error(`Errore pulizia account anonimo (${reason}):`,err);
    if(auth.currentUser?.uid===user.uid){
      auth.signOut().catch(()=>{});
    }
  }finally{
    anonymousCleanupInProgress=false;
  }
}

function saveUserIfNew(user){
  if(!user||!window.db)return Promise.resolve();
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const authName=getUserDisplayName(user);
  const freshData={
    name:authName,
    firstName:'',
    lastName:'',
    nickname:'',
    stats:{...DEFAULT_PROFILE_STATS},
    isAnonymous:user.isAnonymous,
    photoURL:user.photoURL||null,
    updatedAt:now
  };
  const existingData={
    isAnonymous:user.isAnonymous,
    photoURL:user.photoURL||null,
    updatedAt:now
  };
  const userRef=db.collection('users').doc(user.uid);
  const leaderboardRef=db.collection('leaderboard').doc(user.uid);
  let isNewUser=false;
  return userRef.get().then(doc=>{
    isNewUser=!doc.exists;
    const existing=doc.exists?doc.data():null;
    const base=doc.exists?{
      ...existingData,
      stats:{...DEFAULT_PROFILE_STATS,...(existing?.stats||{})}
    }:{...freshData,createdAt:now,totalScore:0};
    return userRef.set(base,{merge:true});
  }).then(()=>leaderboardRef.get()).then(doc=>{
    const base=doc.exists?existingData:{...freshData,totalScore:0};
    return leaderboardRef.set(base,{merge:true});
  }).then(()=>isNewUser).catch(err=>{
    console.error('Errore salvataggio utente Firestore:',err);
    return false;
  });
}

function loadLeaderboard(){
  if(!window.db)return;
  if(unsubscribeLeaderboard)unsubscribeLeaderboard();
  unsubscribeLeaderboard=db.collection('leaderboard')
    .orderBy('totalScore','desc')
    .limit(10)
    .onSnapshot(snapshot=>{
      globalLeaderboard=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      renderHomeLeaderboard();
    },err=>console.error('Errore classifica Firestore:',err));
}

function loadRegisteredUsers(){
  if(!window.db)return;
  if(unsubscribeRegisteredUsers)unsubscribeRegisteredUsers();
  unsubscribeRegisteredUsers=db.collection('users')
    .limit(100)
    .onSnapshot(snapshot=>{
      registeredUsers=snapshot.docs.map(doc=>({id:doc.id,uid:doc.id,...doc.data()}));
      renderRegisteredUserSelect();
      renderFriendsList();
    },err=>{
      console.error('Errore profili registrati Firestore:',err);
      renderRegisteredUserSelect();
    });
}

function listenCurrentUserProfile(user){
  if(unsubscribeCurrentUserProfile)unsubscribeCurrentUserProfile();
  if(unsubscribeCurrentUserLeaderboard)unsubscribeCurrentUserLeaderboard();
  currentUserProfile=null;
  currentUserLeaderboard=null;
  if(!user||!window.db){
    updateUserUI(user);
    return;
  }
  unsubscribeCurrentUserProfile=db.collection('users').doc(user.uid).onSnapshot(doc=>{
    currentUserProfile=doc.exists?{id:doc.id,...doc.data()}:null;
    const displayName=getProfileDisplayName(currentUserProfile||{},user);
    const player=players.find(p=>p.uid===user.uid);
    if(player){
      player.name=displayName;
      renderPlayers();
      renderTeamSection();
    }
    updateUserUI(user);
    updatePresenceState({});
    renderFriendsList();
    hydrateProfilePopup();
  },err=>console.error('Errore profilo utente Firestore:',err));
  unsubscribeCurrentUserLeaderboard=db.collection('leaderboard').doc(user.uid).onSnapshot(doc=>{
    currentUserLeaderboard=doc.exists?{id:doc.id,...doc.data()}:null;
    hydrateProfilePopup();
  },err=>console.error('Errore punteggio profilo Firestore:',err));
}

function openProfilePopup(){
  if(!currentUser)return;
  hydrateProfilePopup();
  switchProfileTab('profile');
  const overlay=document.getElementById('profileOverlay');
  if(overlay)overlay.classList.remove('hidden');
}

function closeProfilePopup(){
  document.getElementById('profileOverlay')?.classList.add('hidden');
}

function switchProfileTab(tab='profile'){
  const isFriends=tab==='friends';
  document.getElementById('profileTabProfile')?.classList.toggle('hidden',isFriends);
  document.getElementById('profileTabFriends')?.classList.toggle('hidden',!isFriends);
  document.getElementById('profileTabBtnProfile')?.classList.toggle('active',!isFriends);
  document.getElementById('profileTabBtnFriends')?.classList.toggle('active',isFriends);
  if(isFriends)renderFriendsList();
}

function renderFriendsList(){
  const el=document.getElementById('friendsList');
  if(!el)return;
  const query=(document.getElementById('friendsSearch')?.value||'').trim().toLowerCase();
  const users=registeredUsers
    .filter(u=>u.uid!==currentUser?.uid)
    .filter(u=>{
      const label=[u.nickname,u.name,u.firstName,u.lastName].filter(Boolean).join(' ').toLowerCase();
      return !query||label.includes(query);
    })
    .sort((a,b)=>(a.nickname||a.name||'').localeCompare(b.nickname||b.name||''));
  if(!currentUser){
    el.innerHTML='<div class="empty">Accedi per vedere gli amici</div>';
    return;
  }
  if(!users.length){
    el.innerHTML='<div class="empty">Nessun utente trovato</div>';
    return;
  }
  el.innerHTML=users.map(u=>{
    const presence=userPresenceMap[u.uid]||{};
    const online=!!presence.online;
    const name=getProfileDisplayName(u,{uid:u.uid,displayName:u.name});
    const currentGame=presence.currentGame&&presence.currentGame!=='menu'&&presence.currentGame!=='offline'
      ? getGameStatsLabel(presence.currentGame)
      : (online?'Nel menu':'Offline');
    return `<div class="friend-row">
      ${renderProfileAvatar(u,name,'friend-avatar')}
      <div>
        <div class="friend-name">${escapeHtml(name)}</div>
        <div class="friend-status"><span class="status-dot${online?' on':''}"></span>${escapeHtml(currentGame)}</div>
      </div>
      <button class="btn-ghost" style="padding:.55rem .8rem" onclick="inviteFriendToLobby('${escapeHtml(u.uid)}')">Invita</button>
    </div>`;
  }).join('');
}

function inviteFriendToLobby(uid){
  const lobby=currentUserProfile?.currentLobby||userPresenceMap[currentUser?.uid]?.currentLobby||'';
  if(!lobby){
    alert('Non hai una lobby attiva da condividere.');
    return;
  }
  if(!uid||!window.db||!currentUser)return;
  db.collection('users').doc(uid).collection('gameInvites').add({
    type:'lobby',
    lobbyCode:lobby,
    status:'pending',
    fromUid:currentUser.uid,
    fromName:getProfileDisplayName(currentUserProfile||{},currentUser),
    createdAt:firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  }).catch(err=>console.error('Errore invito lobby:',err));
}

function hydrateProfilePopup(){
  const profile=currentUserProfile||{};
  const leaderboard=currentUserLeaderboard||{};
  const displayName=getProfileDisplayName(profile,currentUser);
  const fullName=getProfileFullName(profile,currentUser);
  const color=getProfileColor(profile,displayName);
  const stats=getProfileStats(profile,leaderboard);
  const avatarEl=document.getElementById('profileAvatar');
  const heroNickname=document.getElementById('profileHeroNickname');
  const heroName=document.getElementById('profileHeroName');
  const firstName=document.getElementById('profileFirstName');
  const lastName=document.getElementById('profileLastName');
  const nickname=document.getElementById('profileNickname');
  const totalScore=document.getElementById('profileTotalScore');
  const gamesPlayed=document.getElementById('profileGamesPlayed');
  const wins=document.getElementById('profileWins');
  const lastGame=document.getElementById('profileLastGame');
  if(avatarEl){
    avatarEl.textContent=initials(fullName||displayName.replace(/^@/,'')||'TV')||'TV';
    avatarEl.style.background=color.bg;
    avatarEl.style.color=color.color||'#fff';
  }
  if(heroNickname)heroNickname.textContent=displayName;
  if(heroName)heroName.textContent=fullName;
  if(firstName)firstName.value=profile.firstName||'';
  if(lastName)lastName.value=profile.lastName||'';
  if(nickname)nickname.value=profile.nickname||'';
  if(totalScore)totalScore.textContent=stats.totalScore;
  if(gamesPlayed)gamesPlayed.textContent=stats.gamesPlayed;
  if(wins)wins.textContent=stats.wins;
  if(lastGame)lastGame.textContent=stats.lastGame;
}

function normalizeNickname(value){
  const raw=String(value||'').trim().replace(/^@+/,'');
  if(!raw)return '';
  return '@'+raw.replace(/\s+/g,'').slice(0,23);
}

function saveProfilePopup(){
  if(!currentUser||!window.db)return;
  const firstName=document.getElementById('profileFirstName')?.value.trim()||'';
  const lastName=document.getElementById('profileLastName')?.value.trim()||'';
  const nickname=normalizeNickname(document.getElementById('profileNickname')?.value);
  const displayName=getProfileDisplayName({firstName,lastName,nickname,name:getUserDisplayName(currentUser)},currentUser);
  const data={
    firstName,
    lastName,
    nickname,
    name:displayName,
    stats:{...DEFAULT_PROFILE_STATS,...(currentUserProfile?.stats||{})},
    isAnonymous:currentUser.isAnonymous,
    photoURL:currentUser.photoURL||null,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  const batch=db.batch();
  batch.set(db.collection('users').doc(currentUser.uid),data,{merge:true});
  batch.set(db.collection('leaderboard').doc(currentUser.uid),data,{merge:true});
  batch.commit().then(()=>{
    return currentUser.updateProfile?currentUser.updateProfile({displayName}):null;
  }).catch(err=>console.error('Errore salvataggio profilo:',err)).finally(closeProfilePopup);
}

function updatePresenceState(patch={}){
  if(!currentUser||!database)return;
  const data={
    uid:currentUser.uid,
    name:getProfileDisplayName(currentUserProfile||{},currentUser),
    online:true,
    currentGame:patch.currentGame,
    currentScreen:patch.currentScreen,
    currentLobby:patch.currentLobby ?? currentUserProfile?.currentLobby ?? '',
    updatedAt:firebase.database.ServerValue.TIMESTAMP
  };
  Object.keys(data).forEach(key=>data[key]===undefined&&delete data[key]);
  database.ref(`status/${currentUser.uid}`).update(data).catch(err=>console.error('Errore presenza RTDB:',err));
  if(window.db){
    const fsData={
      online:true,
      currentLobby:data.currentLobby||'',
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    };
    if(data.currentGame)fsData.currentGame=data.currentGame;
    if(data.currentScreen)fsData.currentScreen=data.currentScreen;
    db.collection('users').doc(currentUser.uid).set(fsData,{merge:true}).catch(()=>{});
  }
}

function setupPresence(user){
  teardownPresence();
  if(!user||!database)return;
  presenceRef=database.ref(`status/${user.uid}`);
  presenceConnectedRef=database.ref('.info/connected');
  presenceConnectedCallback=snap=>{
    if(!snap.val())return;
    presenceRef.onDisconnect().update({
      online:false,
      currentGame:'offline',
      updatedAt:firebase.database.ServerValue.TIMESTAMP
    });
    const activeScreen=document.querySelector('.screen.active')?.id||'s-hero';
    updatePresenceState({currentScreen:activeScreen,currentGame:getGameNameFromScreen(activeScreen)});
  };
  presenceConnectedRef.on('value',presenceConnectedCallback);
  allPresenceRef=database.ref('status');
  allPresenceRef.on('value',snap=>{
    userPresenceMap=snap.val()||{};
    renderFriendsList();
  });
}

function teardownPresence(){
  if(presenceConnectedRef&&presenceConnectedCallback)presenceConnectedRef.off('value',presenceConnectedCallback);
  if(allPresenceRef)allPresenceRef.off();
  if(presenceRef)presenceRef.update({online:false,currentGame:'offline',updatedAt:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{});
  presenceRef=null;
  presenceConnectedRef=null;
  presenceConnectedCallback=null;
  allPresenceRef=null;
  userPresenceMap={};
}

const GAME_LABELS={
  ruota:'la RUOTA',
  eredita:"L'EREDITA",
  intesa:"INTESA VINCENTE",
  catena:'REAZIONE A CATENA',
  sarabanda:'SARABANDA',
  guesswho:'INDOVINA CHI',
  higherlower:'HIGHER OR LOWER',
  affarituoi:'AFFARI TUOI',
  movieguess:'INDOVINA IL FILM',
  ghigliottina:'LA GHIGLIOTTINA'
};

const MULTIPLAYER_GAMES=['ruota','eredita','intesa','catena','sarabanda','guesswho'];

function isMultiplayerGame(game){
  return MULTIPLAYER_GAMES.includes(game);
}

function showPlayModePopup(game){
  pendingPlayModeGame=game;
  const text=document.getElementById('playModeText');
  const label=GAME_LABELS[game]||game;
  if(text)text.textContent=`Vuoi giocare ${label} in locale o online?`;
  document.getElementById('playModeOverlay')?.classList.remove('hidden');
}

function closePlayModePopup(){
  document.getElementById('playModeOverlay')?.classList.add('hidden');
}

function choosePlayMode(mode){
  selectedPlayMode=mode==='online'?'online':'local';
  const game=pendingPlayModeGame;
  pendingPlayModeGame=null;
  closePlayModePopup();
  if(!game)return;
  if(selectedPlayMode==='online'){
    const onlinePlayers=getOnlineParticipants();
    if(!currentUser||onlinePlayers.length<2){
      alert('Per giocare online servono almeno due giocatori registrati aggiunti alla configurazione.');
      goTo('s-setup');
      return;
    }
  }
  startGame(game,{skipModeChoice:true});
}

async function loadQuestionBank(key,fallback){
  if(selectedPlayMode!=='online'||!window.db)return fallback;
  try{
    const doc=await db.collection('questionBanks').doc(key).get();
    const data=doc.exists?doc.data():null;
    return Array.isArray(data?.items)&&data.items.length?data.items:fallback;
  }catch(err){
    console.error(`Errore caricamento questionBanks/${key}:`,err);
    return fallback;
  }
}

async function seedQuestionBanksToFirestore(){
  if(!window.db)return;
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const banks={
    aua:AUA_Q,
    eredita:ERE_WORDS,
    ruota:WHEEL_PHRASES,
    catena:CHAIN_ROUNDS,
    sarabanda:SARABANDA_TRACKS,
    guesswho:GUESS_WHO_CHARACTERS
  };
  const batch=db.batch();
  Object.entries(banks).forEach(([key,items])=>{
    batch.set(db.collection('questionBanks').doc(key),{
      items,
      updatedAt:now
    },{merge:true});
  });
  return batch.commit();
}

function getCurrentUserName(){
  return getProfileDisplayName(currentUserProfile||{},currentUser);
}

function getOnlineParticipants(){
  return players
    .filter(p=>p.uid)
    .map(p=>({
      uid:p.uid,
      name:p.name,
      isAnonymous:!!p.isAnonymous,
      photoURL:p.photoURL||null
    }));
}

async function sendGameInvites(game,payload={}){
  if(selectedPlayMode!=='online'||!currentUser||!window.db)return;
  const participants=getOnlineParticipants();
  const targets=participants.filter(p=>p.uid!==currentUser.uid);
  if(!targets.length)return;
  const now=firebase.firestore.FieldValue.serverTimestamp();
  const batch=db.batch();
  targets.forEach(target=>{
    const ref=db.collection('users').doc(target.uid).collection('gameInvites').doc();
    batch.set(ref,{
      game,
      status:'pending',
      fromUid:currentUser.uid,
      fromName:getCurrentUserName(),
      toUid:target.uid,
      toName:target.name,
      participants,
      payload,
      createdAt:now,
      updatedAt:now
    });
  });
  return batch.commit().catch(err=>console.error('Errore invio inviti gioco:',err));
}

function listenGameInvites(user){
  if(unsubscribeGameInvites)unsubscribeGameInvites();
  if(!user||!window.db)return;
  unsubscribeGameInvites=db.collection('users').doc(user.uid).collection('gameInvites')
    .where('status','==','pending')
    .onSnapshot(snapshot=>{
      snapshot.docChanges().forEach(change=>{
        if(change.type!=='added')return;
        pendingGameInvite={id:change.doc.id,_ref:change.doc.ref,...change.doc.data()};
        showGameInvitePopup(pendingGameInvite);
      });
    },err=>console.error('Errore inviti gioco:',err));
}

function showGameInvitePopup(invite){
  const text=document.getElementById('gameInviteText');
  const overlay=document.getElementById('gameInviteOverlay');
  if(text){
    const label=GAME_LABELS[invite.game]||invite.game||'un gioco';
    text.textContent=`${invite.fromName||'Un giocatore'} ti ha invitato a giocare ${label}. Vuoi partecipare?`;
  }
  if(overlay)overlay.classList.remove('hidden');
}

function closeGameInvitePopup(){
  document.getElementById('gameInviteOverlay')?.classList.add('hidden');
}

function declineGameInvite(){
  if(pendingGameInvite?._ref){
    pendingGameInvite._ref.update({
      status:'declined',
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err=>console.error('Errore rifiuto invito:',err));
  }
  pendingGameInvite=null;
  closeGameInvitePopup();
}

function acceptGameInvite(){
  if(!pendingGameInvite||!window.db)return;
  const invite=pendingGameInvite;
  invite._ref?.update({
    status:'accepted',
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  }).catch(err=>console.error('Errore accettazione invito:',err));
  pendingGameInvite=null;
  selectedPlayMode='online';
  closeGameInvitePopup();
  joinInvitedGame(invite);
}

function ensureInviteParticipants(invite){
  (invite.participants||[]).forEach(participant=>{
    if(players.some(p=>p.uid===participant.uid))return;
    players.push({
      id:nPid++,
      name:participant.name||`Anonimo ${participant.uid.slice(0,4).toUpperCase()}`,
      teamId:null,
      score:0,
      ci:players.length%TC.length,
      uid:participant.uid,
      isAnonymous:!!participant.isAnonymous,
      photoURL:participant.photoURL||null
    });
  });
  renderPlayers();
  renderTeamSection();
  renderRegisteredUserSelect();
}

function getPlayerIdByUid(uid){
  return players.find(p=>p.uid===uid)?.id||null;
}

function stopGameSessionListener(){
  if(unsubscribeGameSession)unsubscribeGameSession();
  unsubscribeGameSession=null;
  activeGameSessionId=null;
  activeGameSessionGame=null;
}

async function createGameSession(game,state={}){
  if(selectedPlayMode!=='online'||!currentUser||!window.db)return null;
  try{
    const ref=await db.collection('gameSessions').add({
      game,
      state,
      createdBy:currentUser.uid,
      updatedBy:currentUser.uid,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    activeGameSessionId=ref.id;
    activeGameSessionGame=game;
    return ref.id;
  }catch(err){
    console.error('Errore creazione sessione online:',err);
    return null;
  }
}

function updateGameSession(state){
  if(!activeGameSessionId||!currentUser||!window.db||applyingRemoteWheelState||applyingRemoteSessionState)return;
  db.collection('gameSessions').doc(activeGameSessionId).set({
    state,
    updatedBy:currentUser.uid,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
  },{merge:true}).catch(err=>console.error('Errore sync sessione gioco:',err));
}

function listenGameSession(sessionId){
  if(!sessionId||!window.db)return;
  if(unsubscribeGameSession)unsubscribeGameSession();
  activeGameSessionId=sessionId;
  unsubscribeGameSession=db.collection('gameSessions').doc(sessionId).onSnapshot(doc=>{
    if(!doc.exists)return;
    const data=doc.data();
    if(data.updatedBy&&data.updatedBy===currentUser?.uid)return;
    activeGameSessionGame=data.game||activeGameSessionGame;
    if(data.game==='ruota'&&data.state)applyRemoteWheelState(data.state);
    if(data.game==='catena'&&data.state)applyRemoteChainState(data.state);
    if(data.game==='eredita'&&data.state)applyRemoteEreditaState(data.state);
    if(data.game==='sarabanda'&&data.state)applyRemoteSarabandaState(data.state);
    if(data.game==='guesswho'&&data.state)applyRemoteGuessWhoState(data.state);
  },err=>console.error('Errore ascolto sessione gioco:',err));
}

async function cleanupOnlineGameArtifacts(){
  if(!activeGameSessionId||!window.db)return;
  const sessionId=activeGameSessionId;
  const participantUids=[
    ...new Set([
      ...getOnlineParticipants().map(p=>p.uid),
      currentUser?.uid
    ].filter(Boolean))
  ];
  try{
    const batch=db.batch();
    batch.delete(db.collection('gameSessions').doc(sessionId));
    for(const uid of participantUids){
      const snap=await db.collection('users').doc(uid).collection('gameInvites')
        .where('payload.sessionId','==',sessionId)
        .get();
      snap.docs.forEach(doc=>batch.delete(doc.ref));
    }
    await batch.commit();
  }catch(err){
    console.error('Errore pulizia sessione online:',err);
  }finally{
    stopGameSessionListener();
  }
}

function joinInvitedGame(invite){
  ensureInviteParticipants(invite);
  const payload=invite.payload||{};
  if(invite.game==='ruota'){
    const starterId=getPlayerIdByUid(payload.starterUid)||players[0]?.id;
    if(starterId){
      selWheelPid=starterId;
      beginWheel({
        fromInvite:true,
        phrase:payload.phrase,
        category:payload.category,
        participantUids:payload.participantUids,
        sessionId:payload.sessionId
      });
    }
    return;
  }
  if(invite.game==='eredita'){
    if(payload.sessionId)listenGameSession(payload.sessionId);
    selP1=getPlayerIdByUid(payload.p1Uid);
    selP2=getPlayerIdByUid(payload.p2Uid);
    if(selP1&&selP2&&selP1!==selP2)beginEredita({fromInvite:true,words:payload.words,revOrders:payload.revOrders,sessionId:payload.sessionId});
    else startGame('eredita');
    return;
  }
  if(invite.game==='intesa'){
    if(payload.sessionId)listenGameSession(payload.sessionId);
    selP1=getPlayerIdByUid(payload.p1Uid);
    selP2=getPlayerIdByUid(payload.p2Uid);
    if(selP1&&selP2&&selP1!==selP2)beginIntesa({fromInvite:true,sessionId:payload.sessionId});
    else startGame('intesa');
    return;
  }
  if(invite.game==='catena'){
    if(payload.sessionId)listenGameSession(payload.sessionId);
    selChainP1=getPlayerIdByUid(payload.p1Uid);
    selChainP2=getPlayerIdByUid(payload.p2Uid);
    if(selChainP1&&selChainP2&&selChainP1!==selChainP2)beginChain({fromInvite:true,round:payload.round,sessionId:payload.sessionId});
    else startGame('catena');
    return;
  }
  if(invite.game==='sarabanda'){
    if(payload.sessionId)listenGameSession(payload.sessionId);
    beginSarabanda({fromInvite:true,tracks:payload.tracks,sessionId:payload.sessionId});
    return;
  }
  if(invite.game==='guesswho'){
    if(payload.sessionId)listenGameSession(payload.sessionId);
    beginGuessWho({fromInvite:true,characters:payload.characters,participantUids:payload.participantUids,sessionId:payload.sessionId});
  }
}

/* ── GAME START ── */
function startGame(game,options={}){
  if(!players.length){goTo('s-setup');return;}
  if(isMultiplayerGame(game)&&!options.skipModeChoice){
    showPlayModePopup(game);
    return;
  }
  activeStatsGame=game;
  if(['eredita','intesa','ruota','catena'].includes(game)&&players.length<2){
    stopAuaAudio();
    stopRdfAudio();
    goTo('s-setup');
    return;
  }
  if(game==='sarabanda'){
    if(players.length<2){goTo('s-setup');return;}
    beginSarabanda();
    return;
  }
  if(game==='guesswho'){
    beginGuessWho();
    return;
  }
  if(game==='higherlower'){
    stopAuaAudio();
    stopRdfAudio();
    selHigherPid=null;
    selectedHolCategory=selectedHolCategory||Object.keys(HIGHER_LOWER_BANKS)[0];
    if(players.length===1){
      selHigherPid=players[0].id;
      beginHigherLower();
      return;
    }
    document.getElementById('pick-grid-hol').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-hol-${p.id}" onclick="selPickHigherLower(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${escapeHtml(p.name)}</div>
        <div class="pp-info">${t?escapeHtml(t.name):'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    renderHigherLowerCategories();
    document.getElementById('btn-pick-hol-go').disabled=true;
    document.getElementById('btn-pick-hol-go').onclick=()=>beginHigherLower();
    goTo('s-pick-hol');
    return;
  }
  if(game==='affarituoi'){
    stopAuaAudio();
    stopRdfAudio();
    selAffariPid=null;
    if(players.length===1){
      selAffariPid=players[0].id;
      beginAffariTuoi();
      return;
    }
    document.getElementById('pick-grid-affari').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-affari-${p.id}" onclick="selPickAffari(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${escapeHtml(p.name)}</div>
        <div class="pp-info">${t?escapeHtml(t.name):'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    document.getElementById('btn-pick-affari-go').disabled=true;
    document.getElementById('btn-pick-affari-go').onclick=()=>beginAffariTuoi();
    goTo('s-pick-affari');
    return;
  }
  if(game==='movieguess'){
    stopAuaAudio();
    stopRdfAudio();
    selMoviePid=null;
    if(players.length===1){
      selMoviePid=players[0].id;
      beginMovieGuess();
      return;
    }
    document.getElementById('pick-grid-movie').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-movie-${p.id}" onclick="selPickMovie(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${escapeHtml(p.name)}</div>
        <div class="pp-info">${t?escapeHtml(t.name):'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    document.getElementById('btn-pick-movie-go').disabled=true;
    document.getElementById('btn-pick-movie-go').onclick=()=>beginMovieGuess();
    goTo('s-pick-movie');
    return;
  }
  if(game==='ghigliottina'){
    stopAuaAudio();
    stopRdfAudio();
    selGhigliottinaPid=null;
    if(players.length===1){
      selGhigliottinaPid=players[0].id;
      beginGhigliottina();
      return;
    }
    document.getElementById('pick-grid-ghigliottina').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-ghigliottina-${p.id}" onclick="selPickGhigliottina(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${escapeHtml(p.name)}</div>
        <div class="pp-info">${t?escapeHtml(t.name):'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    goTo('s-pick-ghigliottina');
    startGhigliottinaIntro();
    return;
  }
  if(game==='catena'){
    if(players.length<2){goTo('s-setup');return;}
    stopAuaAudio();
    selChainP1=null;selChainP2=null;
    ['p1','p2'].forEach(slot=>{
      document.getElementById('pick-grid-chain-'+slot).innerHTML=players.map(p=>{
        const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
        return `<div class="player-pick" id="pp-chain-${slot}-${p.id}" onclick="selPickChain('${slot}',${p.id})" style="margin-bottom:.5rem">
          <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
          <div class="pp-name">${p.name}</div>
          <div class="pp-info">${t?t.name:'Libero'} · ${p.score}pt</div></div>`;
      }).join('');
    });
    document.getElementById('btn-pick-chain-go').disabled=true;
    document.getElementById('btn-pick-chain-go').onclick=()=>beginChain();
    goTo('s-pick-chain');
    return;
  }
  if(game==='ruota'){
    stopAuaAudio();
    selWheelPid=null;
    document.getElementById('pick-grid-wheel').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-wheel-${p.id}" onclick="selPickWheel(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${p.name}</div>
        <div class="pp-info">${t?t.name:'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    const btn=document.getElementById('btn-pick-wheel-go');
    if(btn){
      btn.disabled=true;
      btn.onclick=()=>startWheelIntroVideo();
    }
    goTo('s-pick-wheel');
    return;
  }
  if(game==='intesa'){
    selP1=null;selP2=null;
    ['p1','p2'].forEach(slot=>{
      document.getElementById('pick-grid-'+slot).innerHTML=players.map(p=>{
        const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
        return `<div class="player-pick" id="pp2-${slot}-${p.id}" onclick="selPick2('${slot}',${p.id})" style="margin-bottom:.5rem">
          <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
          <div class="pp-name">${p.name}</div>
          <div class="pp-info">${t?t.name:'Libero'}</div></div>`;
      }).join('');
    });
    document.getElementById('btn-pick2-go').disabled=true;
    document.getElementById('btn-pick2-go').textContent='APRI GIOCO ›';
    document.getElementById('btn-pick2-go').onclick=()=>beginIntesa();
    goTo('s-pick2');
    return;
  }
  if(game==='taboo'){
    selPid=null;
    selTabooPid=null;
    if(players.length===1){
      selTabooPid=players[0].id;
      beginTaboo();
      return;
    }
    document.getElementById('pick-grid-taboo').innerHTML=players.map(p=>{
      const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
      return `<div class="player-pick" id="pp-taboo-${p.id}" onclick="selPickTaboo(${p.id})">
        <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
        <div class="pp-name">${p.name}</div>
        <div class="pp-info">${t?t.name:'Libero'} · ${p.score}pt</div></div>`;
    }).join('');
    document.getElementById('btn-pick-taboo-go').disabled=true;
    document.getElementById('btn-pick-taboo-go').onclick=()=>beginTaboo();
    goTo('s-pick-taboo');
    return;
  }
  if(game==='aua'){
    selPid=null;
    const renderAuaPlayers=()=>{
      document.getElementById('pick-grid').innerHTML=players.map(p=>{
        const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
        return `<div class="player-pick" id="pp1-${p.id}" onclick="selPick1(${p.id})">
          <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
          <div class="pp-name">${p.name}</div>
          <div class="pp-info">${t?t.name:'Libero'} · ${p.score}pt</div></div>`;
      }).join('');
    };
    if(players.length===1){
      selPid=players[0].id;
      renderAuaPlayers();
      document.getElementById('pp1-'+selPid)?.classList.add('selected');
      document.getElementById('btn-pick-go').disabled=false;
      document.getElementById('btn-pick-go').onclick=()=>beginAUA();
      startAuaIntro();
      goTo('s-pick');
      return;
    }
    renderAuaPlayers();
    document.getElementById('btn-pick-go').disabled=true;
    document.getElementById('btn-pick-go').onclick=()=>beginAUA();
    startAuaIntro();
    goTo('s-pick');
    return;
  }
  if(game==='eredita'){
    selP1=null;selP2=null;
    ['p1','p2'].forEach(slot=>{
      document.getElementById('pick-grid-'+slot).innerHTML=players.map(p=>{
        const c=TC[p.ci%TC.length];const t=teams.find(t=>t.mids.includes(p.id));
        return `<div class="player-pick" id="pp2-${slot}-${p.id}" onclick="selPick2('${slot}',${p.id})" style="margin-bottom:.5rem">
          <div class="pp-avatar" style="background:${c.light};color:${c.hex}">${initials(p.name)}</div>
          <div class="pp-name">${p.name}</div>
          <div class="pp-info">${t?t.name:'Libero'}</div></div>`;
      }).join('');
    });
    document.getElementById('btn-pick2-go').disabled=true;
    document.getElementById('btn-pick2-go').textContent='INIZIA LA SFIDA ›';
    document.getElementById('btn-pick2-go').onclick=()=>beginEredita();
    goTo('s-pick2');
    return;
  }
  console.warn('Gioco non riconosciuto:',game);
  goTo('s-hero');
}
function selPick1(id){
  selPid=id;
  document.querySelectorAll('#pick-grid .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp1-'+id)?.classList.add('selected');
  document.getElementById('btn-pick-go').disabled=false;
}
function selPickTaboo(id){
  selTabooPid=id;
  document.querySelectorAll('#pick-grid-taboo .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-taboo-'+id)?.classList.add('selected');
  document.getElementById('btn-pick-taboo-go').disabled=false;
}
function selPickHigherLower(id){
  selHigherPid=id;
  document.querySelectorAll('#pick-grid-hol .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-hol-'+id)?.classList.add('selected');
  updateHigherLowerStartButton();
}
function selPickAffari(id){
  selAffariPid=id;
  document.querySelectorAll('#pick-grid-affari .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-affari-'+id)?.classList.add('selected');
  document.getElementById('btn-pick-affari-go').disabled=false;
}
function selPickMovie(id){
  selMoviePid=id;
  document.querySelectorAll('#pick-grid-movie .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-movie-'+id)?.classList.add('selected');
  updateMovieStartButton();
}
function selPickGhigliottina(id){
  selGhigliottinaPid=id;
  document.querySelectorAll('#pick-grid-ghigliottina .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-ghigliottina-'+id)?.classList.add('selected');
  const btn=document.getElementById('btn-pick-ghigliottina-go');
  if(btn)btn.disabled=false;
}
function selectHigherLowerCategory(key){
  if(!HIGHER_LOWER_BANKS[key])return;
  selectedHolCategory=key;
  renderHigherLowerCategories();
  updateHigherLowerStartButton();
}
function updateHigherLowerStartButton(){
  const btn=document.getElementById('btn-pick-hol-go');
  if(btn)btn.disabled=!(selHigherPid&&HIGHER_LOWER_BANKS[selectedHolCategory]);
}
function selPick2(slot,id){
  if(slot==='p1')selP1=id;else selP2=id;
  document.querySelectorAll(`#pick-grid-${slot} .player-pick`).forEach(e=>e.classList.remove('selected'));
  document.getElementById(`pp2-${slot}-${id}`)?.classList.add('selected');
  document.getElementById('btn-pick2-go').disabled=!(selP1&&selP2&&selP1!==selP2);
}

function selPickChain(slot,id){
  if(slot==='p1')selChainP1=id;else selChainP2=id;
  document.querySelectorAll(`#pick-grid-chain-${slot} .player-pick`).forEach(e=>e.classList.remove('selected'));
  document.getElementById(`pp-chain-${slot}-${id}`)?.classList.add('selected');
  document.getElementById('btn-pick-chain-go').disabled=!(selChainP1&&selChainP2&&selChainP1!==selChainP2);
}

/* ══════════════════════════════
   HIGHER OR LOWER
══════════════════════════════ */
let higherLowerState={};
let higherLowerTimer=null;

function renderHigherLowerCategories(){
  const el=document.getElementById('hol-categories');
  if(!el)return;
  el.innerHTML=Object.entries(HIGHER_LOWER_BANKS).map(([key,cat])=>`
    <button class="hol-cat${key===selectedHolCategory?' selected':''}" type="button" onclick="selectHigherLowerCategory('${key}')">
      <div class="hol-cat-name">${escapeHtml(cat.label)}</div>
      <div class="hol-cat-sub">${escapeHtml(cat.sub)}</div>
    </button>
  `).join('');
}

function getHigherLowerItemHtml(item,side){
  const image=escapeHtml(item.image||'');
  return `
    <div class="hol-img" style="background-image:url('${image}')"></div>
    <div class="hol-fallback">${escapeHtml(item.emoji||'📦')}</div>
    <div class="hol-body">
      <div class="hol-kicker">Oggetto ${side.toUpperCase()}</div>
      <div class="hol-name">${escapeHtml(item.name)}</div>
      <div class="hol-value">${escapeHtml(item.display)}</div>
    </div>
  `;
}

function markHigherLowerFallback(card,item){
  if(!card||!item?.image)return;
  const img=new Image();
  img.onload=()=>{};
  img.onerror=()=>{
    const bg=card.querySelector('.hol-img');
    const fb=card.querySelector('.hol-fallback');
    if(bg)bg.style.display='none';
    if(fb)fb.style.display='flex';
  };
  img.src=item.image;
}

async function beginHigherLower(){
  activeStatsGame='higherlower';
  clearTimeout(higherLowerTimer);
  higherLowerTimer=null;
  const player=players.find(p=>p.id===selHigherPid);
  const bank=HIGHER_LOWER_BANKS[selectedHolCategory];
  if(!player||!bank){goTo('s-pick-hol');return;}
  const items=shuffleArray([...bank.items]);
  if(items.length<3){
    alert('Servono almeno tre carte per giocare a Higher or Lower.');
    return;
  }
  higherLowerState={
    pid:player.id,
    category:selectedHolCategory,
    items,
    current:items[0],
    challenger:items[1],
    nextIdx:2,
    streak:0,
    locked:false,
    message:`${player.name}, scegli quale vale di piu.`
  };
  renderHigherLower();
  goTo('s-higherlower');
}

function renderHigherLower(){
  const state=higherLowerState;
  if(!state?.current||!state?.challenger)return;
  const player=players.find(p=>p.id===state.pid);
  const cat=HIGHER_LOWER_BANKS[state.category];
  const cardA=document.getElementById('hol-card-a');
  const cardB=document.getElementById('hol-card-b');
  document.getElementById('hol-player').textContent=player?.name||'Giocatore';
  document.getElementById('hol-score').textContent=state.streak||0;
  document.getElementById('hol-message').textContent=state.message||`Scegli il valore piu alto: ${cat?.unit||'valore stimato'}.`;
  if(cardA){
    cardA.className='hol-card';
    cardA.disabled=!!state.locked;
    cardA.innerHTML=getHigherLowerItemHtml(state.current,'a');
    markHigherLowerFallback(cardA,state.current);
  }
  if(cardB){
    cardB.className='hol-card';
    cardB.disabled=!!state.locked;
    cardB.innerHTML=getHigherLowerItemHtml(state.challenger,'b');
    markHigherLowerFallback(cardB,state.challenger);
  }
}

function chooseHigherLower(side){
  const state=higherLowerState;
  if(!state?.current||!state?.challenger||state.locked)return;
  state.locked=true;
  const a=state.current;
  const b=state.challenger;
  const higher=a.value>=b.value?'a':'b';
  const picked=side==='a'?'a':'b';
  const correct=picked===higher;
  const cardA=document.getElementById('hol-card-a');
  const cardB=document.getElementById('hol-card-b');
  cardA?.classList.add('revealed',higher==='a'?'higher':'lower');
  cardB?.classList.add('revealed',higher==='b'?'higher':'lower');
  if(correct){
    state.streak++;
    document.getElementById('hol-score').textContent=state.streak;
    state.message=`Giusto! ${higher==='a'?a.name:b.name} vale di piu.`;
    document.getElementById('hol-message').textContent=state.message;
    higherLowerTimer=setTimeout(nextHigherLowerRound,1050);
    return;
  }
  state.message=`Sbagliato: ${higher==='a'?a.name:b.name} valeva di piu.`;
  document.getElementById('hol-message').textContent=state.message;
  higherLowerTimer=setTimeout(()=>endHigherLower(false),1400);
}

function nextHigherLowerRound(){
  const state=higherLowerState;
  if(!state?.items)return;
  const a=state.current;
  const b=state.challenger;
  state.current=a.value>=b.value?a:b;
  if(state.nextIdx>=state.items.length){
    endHigherLower(true);
    return;
  }
  state.challenger=state.items[state.nextIdx++];
  state.locked=false;
  state.message='Continua la serie: quale vale di piu?';
  renderHigherLower();
}

function endHigherLower(completed=false){
  clearTimeout(higherLowerTimer);
  higherLowerTimer=null;
  const state=higherLowerState;
  const player=players.find(p=>p.id===state?.pid);
  const points=state?.streak||0;
  if(player&&points>0)awardPlayerPoints(player.id,points,'higher-lower');
  document.getElementById('win-name').textContent=player?.name||'Giocatore';
  document.getElementById('win-sub').textContent=completed
    ? `Serie chiusa con ${points} risposte corrette!`
    : `Game over: ${points} risposte corrette.`;
  document.getElementById('win-scores').innerHTML=`<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Risultato Higher or Lower</div>
    <div class="sc-row">
      <div class="sc-rank">1</div>
      <div class="sc-name">${escapeHtml(player?.name||'Giocatore')}</div>
      <div class="sc-pts">${points}</div>
    </div>`;
  recordCompletedGame('higherlower',player?.uid&&points>0?[player.uid]:[]);
  higherLowerState={};
  goTo('s-win');
}

/* ══════════════════════════════
   INDOVINA IL FILM
══════════════════════════════ */
let movieGuessState={};
let movieGuessTimer=null;
const TMDB_PROXY_BASE='https://tvgn-tmdb-proxy.alupidi888.workers.dev/tmdb';

function updateMovieStartButton(){
  const btn=document.getElementById('btn-pick-movie-go');
  if(btn)btn.disabled=!selMoviePid;
}

async function tmdbFetch(path,params={}){
  const url=new URL(`${TMDB_PROXY_BASE}${path}`);
  Object.entries({language:'it-IT',...params}).forEach(([key,value])=>{
    if(value!==undefined&&value!==null)url.searchParams.set(key,value);
  });
  const response=await fetch(url.toString(),{headers:{accept:'application/json'}});
  if(!response.ok)throw new Error(`TMDB ${response.status}`);
  return response.json();
}

function normalizeMovieTitle(text){
  return (text||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/gi,'')
    .toLowerCase();
}

async function loadMovieGuessBank(){
  const page=Math.floor(Math.random()*8)+1;
  const data=await tmdbFetch('/movie/popular',{page});
  const movies=(data.results||[])
    .filter(movie=>movie.poster_path&&movie.title&&movie.overview)
    .sort(()=>Math.random()-.5)
    .slice(0,8);
  const enriched=[];
  for(const movie of movies){
    try{
      const credits=await tmdbFetch(`/movie/${movie.id}/credits`,{});
      enriched.push({
        ...movie,
        cast:(credits.cast||[]).slice(0,4).map(person=>person.name).filter(Boolean)
      });
    }catch(err){
      enriched.push({...movie,cast:[]});
    }
  }
  return enriched;
}

async function beginMovieGuess(){
  activeStatsGame='movieguess';
  const player=players.find(p=>p.id===selMoviePid)||players[0];
  if(!player)return;
  movieGuessState={pid:player.id,idx:0,score:0,clueLevel:1,movies:[],message:'Carico film da TMDB...'};
  goTo('s-movieguess');
  renderMovieGuess();
  try{
    movieGuessState.movies=await loadMovieGuessBank();
    if(!movieGuessState.movies.length)throw new Error('Nessun film disponibile');
    movieGuessState.message='Poster oscurato: indovina il film.';
  }catch(err){
    movieGuessState.message=`Errore API: ${err.message}. Controlla il proxy Cloudflare TMDB.`;
  }
  renderMovieGuess();
}

function getCurrentMovieGuess(){
  return movieGuessState.movies?.[movieGuessState.idx]||null;
}

function renderMovieGuess(){
  const player=players.find(p=>p.id===movieGuessState.pid);
  const movie=getCurrentMovieGuess();
  const poster=document.getElementById('movie-poster');
  const missing=document.getElementById('movie-poster-missing');
  const clues=document.getElementById('movie-clues');
  const answer=document.getElementById('movie-answer');
  if(document.getElementById('movie-player'))document.getElementById('movie-player').textContent=player?.name||'Giocatore';
  if(document.getElementById('movie-score'))document.getElementById('movie-score').textContent=movieGuessState.score||0;
  if(document.getElementById('movie-message'))document.getElementById('movie-message').textContent=movieGuessState.message||'';
  if(!movie){
    if(clues)clues.innerHTML='<div class="movie-clue"><div class="movie-clue-value">In attesa dei film...</div></div>';
    if(poster)poster.style.backgroundImage='';
    if(missing)missing.style.display='flex';
    return;
  }
  if(answer)answer.value='';
  if(poster){
    poster.style.backgroundImage=`url(https://image.tmdb.org/t/p/w500${movie.poster_path})`;
    poster.classList.toggle('revealed',!!movieGuessState.revealed);
  }
  if(missing)missing.style.display=movie.poster_path?'none':'flex';
  if(clues){
    const year=(movie.release_date||'').slice(0,4)||'—';
    const items=[
      ['Anno',year],
      ['Voto TMDB',movie.vote_average?`${movie.vote_average.toFixed(1)} / 10`:'—']
    ];
    if(movieGuessState.clueLevel>=2)items.push(['Cast',movie.cast?.length?movie.cast.join(', '):'Cast non disponibile']);
    if(movieGuessState.clueLevel>=3)items.push(['Trama',movie.overview||'Trama non disponibile']);
    clues.innerHTML=items.map(([label,value])=>`
      <div class="movie-clue">
        <div class="movie-clue-label">${escapeHtml(label)}</div>
        <div class="movie-clue-value">${escapeHtml(value)}</div>
      </div>
    `).join('');
  }
}

function nextMovieClue(){
  const movie=getCurrentMovieGuess();
  if(!movie)return;
  movieGuessState.clueLevel=Math.min(3,(movieGuessState.clueLevel||1)+1);
  movieGuessState.message=movieGuessState.clueLevel===3?'Ultimo indizio: la trama.':'Nuovo indizio sbloccato.';
  renderMovieGuess();
}

function submitMovieGuess(){
  const movie=getCurrentMovieGuess();
  if(!movie)return;
  const guess=document.getElementById('movie-answer')?.value||'';
  const ok=normalizeMovieTitle(guess)===normalizeMovieTitle(movie.title)||normalizeMovieTitle(guess)===normalizeMovieTitle(movie.original_title);
  if(!ok){
    movieGuessState.message='Non e lui. Prova ancora o chiedi un indizio.';
    renderMovieGuess();
    return;
  }
  const points=Math.max(1,4-(movieGuessState.clueLevel||1));
  movieGuessState.score=(movieGuessState.score||0)+points;
  movieGuessState.revealed=true;
  movieGuessState.message=`Esatto: ${movie.title}! +${points} pt`;
  renderMovieGuess();
}

function revealMovieAnswer(){
  const movie=getCurrentMovieGuess();
  if(!movie)return;
  movieGuessState.revealed=true;
  movieGuessState.clueLevel=3;
  movieGuessState.message=`Era: ${movie.title}`;
  renderMovieGuess();
}

function nextMovieRound(){
  if(!movieGuessState.movies?.length)return;
  if(movieGuessState.idx>=movieGuessState.movies.length-1){
    endMovieGuess();
    return;
  }
  movieGuessState.idx++;
  movieGuessState.clueLevel=1;
  movieGuessState.revealed=false;
  movieGuessState.message='Nuovo poster: indovina il film.';
  renderMovieGuess();
}

function endMovieGuess(){
  clearTimeout(movieGuessTimer);
  movieGuessTimer=null;
  const player=players.find(p=>p.id===movieGuessState.pid);
  const points=movieGuessState.score||0;
  if(player&&points>0)awardPlayerPoints(player.id,points,'movieguess');
  document.getElementById('win-name').textContent=player?.name||'Giocatore';
  document.getElementById('win-sub').textContent=`Hai totalizzato ${points} punti a Indovina il Film.`;
  document.getElementById('win-scores').innerHTML=`<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Risultato Indovina il Film</div>
    <div class="sc-row">
      <div class="sc-rank">🎬</div>
      <div class="sc-name">${escapeHtml(player?.name||'Giocatore')}</div>
      <div class="sc-pts">${points}</div>
    </div>`;
  recordCompletedGame('movieguess',player?.uid&&points>0?[player.uid]:[]);
  movieGuessState={};
  goTo('s-win');
}

/* ══════════════════════════════
   LA GHIGLIOTTINA
══════════════════════════════ */
const GHIGLIOTTINA_BANK=[
  {answer:'TEMPO',prize:200000,pairs:[
    {options:['Oro','Sale'],correct:'Oro'},
    {options:['Perso','Lungo'],correct:'Perso'},
    {options:['Meteo','Ferro'],correct:'Meteo'},
    {options:['Supplementare','Quadrato'],correct:'Supplementare'},
    {options:['Libero','Rosso'],correct:'Libero'}
  ]},
  {answer:'STELLA',prize:200000,pairs:[
    {options:['Cometa','Tenda'],correct:'Cometa'},
    {options:['Cadente','Fermo'],correct:'Cadente'},
    {options:['Polare','Caldo'],correct:'Polare'},
    {options:['Cinema','Forno'],correct:'Cinema'},
    {options:['Alpina','Bassa'],correct:'Alpina'}
  ]},
  {answer:'CARTA',prize:200000,pairs:[
    {options:['Credito','Pietra'],correct:'Credito'},
    {options:['Identita','Nebbia'],correct:'Identita'},
    {options:['Geografica','Veloce'],correct:'Geografica'},
    {options:['Forno','Forbice'],correct:'Forbice'},
    {options:['Regalo','Motore'],correct:'Regalo'}
  ]},
  {answer:'FUOCO',prize:200000,pairs:[
    {options:['Artificio','Silenzio'],correct:'Artificio'},
    {options:['Sacro','Freddo'],correct:'Sacro'},
    {options:['Amico','Nemico'],correct:'Amico'},
    {options:['Incrociato','Rotondo'],correct:'Incrociato'},
    {options:['Lento','Vivo'],correct:'Vivo'}
  ]},
  {answer:'PONTE',prize:200000,pairs:[
    {options:['Levate','Letto'],correct:'Levate'},
    {options:['Radio','Sospeso'],correct:'Sospeso'},
    {options:['Dentale','Vento'],correct:'Dentale'},
    {options:['Festivo','Profondo'],correct:'Festivo'},
    {options:['Comando','Milvio'],correct:'Milvio'}
  ]},
  {answer:'LUNA',prize:200000,pairs:[
    {options:['Piena','Vuota'],correct:'Piena'},
    {options:['Miele','Sale'],correct:'Miele'},
    {options:['Park','Nuova'],correct:'Nuova'},
    {options:['Storta','Dritta'],correct:'Storta'},
    {options:['Calante','Crescita'],correct:'Calante'}
  ]},
  {answer:'CHIAVE',prize:200000,pairs:[
    {options:['Violino','Volta'],correct:'Violino'},
    {options:['Inglese','Francese'],correct:'Inglese'},
    {options:['Accesso','Uscita'],correct:'Accesso'},
    {options:['Lettura','Cottura'],correct:'Lettura'},
    {options:['Soluzione','Domanda'],correct:'Soluzione'}
  ]},
  {answer:'MARE',prize:200000,pairs:[
    {options:['Aperto','Chiuso'],correct:'Aperto'},
    {options:['Nero','Bianco'],correct:'Nero'},
    {options:['Mosso','Fermo'],correct:'Mosso'},
    {options:['Lungo','Alto'],correct:'Alto'},
    {options:['Sale','Zucchero'],correct:'Sale'}
  ]},
  {answer:'CORONA',prize:200000,pairs:[
    {options:['Reale','Locale'],correct:'Reale'},
    {options:['Alloro','Menta'],correct:'Alloro'},
    {options:['Dentale','Fiscale'],correct:'Dentale'},
    {options:['Spine','Fiori'],correct:'Spine'},
    {options:['Svedese','Tedesca'],correct:'Svedese'}
  ]},
  {answer:'FILO',prize:200000,pairs:[
    {options:['Diretto','Storto'],correct:'Diretto'},
    {options:['Spinato','Liscio'],correct:'Spinato'},
    {options:['Logico','Magico'],correct:'Logico'},
    {options:['Voce','Luce'],correct:'Voce'},
    {options:['Conduttore','Attore'],correct:'Conduttore'}
  ]}
];
let ghigliottinaState={};

function clearGhigliottinaTimer(){
  if(ghigliottinaState.timerId){
    clearInterval(ghigliottinaState.timerId);
    ghigliottinaState.timerId=null;
  }
  if(ghigIntroTimer){
    clearTimeout(ghigIntroTimer);
    ghigIntroTimer=null;
  }
}

function setGhigliottinaAudio(){
  if(!ghigIntroAudio)ghigIntroAudio=document.getElementById('ghig-intro-audio');
  if(!ghigThemeAudio)ghigThemeAudio=document.getElementById('ghig-theme-audio');
}

function stopGhigliottinaAudio(){
  setGhigliottinaAudio();
  [ghigIntroAudio,ghigThemeAudio].forEach(audio=>{
    if(!audio)return;
    audio.pause();
    try{audio.currentTime=0;}catch(err){}
  });
}

function startGhigliottinaIntro(){
  clearGhigliottinaTimer();
  stopGhigliottinaAudio();
  setGhigliottinaAudio();
  if(ghigIntroAudio){
    ghigIntroAudio.currentTime=0;
    ghigIntroAudio.play().catch(()=>{});
  }
  ghigIntroTimer=setTimeout(()=>{
    ghigIntroTimer=null;
    if(ghigIntroAudio){
      ghigIntroAudio.pause();
      try{ghigIntroAudio.currentTime=0;}catch(err){}
    }
    if(!selGhigliottinaPid&&players.length){
      selGhigliottinaPid=players[0].id;
      document.getElementById('pp-ghigliottina-'+selGhigliottinaPid)?.classList.add('selected');
    }
    beginGhigliottina();
  },15000);
}

function startGhigliottinaTheme(){
  setGhigliottinaAudio();
  if(!ghigThemeAudio)return;
  ghigThemeAudio.currentTime=0;
  ghigThemeAudio.play().catch(()=>{});
}

function formatGhigliottinaPrize(value){
  return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0);
}

function normalizeGhigliottinaAnswer(value){
  return String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]/gi,'')
    .toLowerCase();
}

function beginGhigliottina(){
  activeStatsGame='ghigliottina';
  const player=players.find(p=>p.id===selGhigliottinaPid)||players[0];
  if(!player)return;
  const puzzle=GHIGLIOTTINA_BANK[Math.floor(Math.random()*GHIGLIOTTINA_BANK.length)];
  clearGhigliottinaTimer();
  setGhigliottinaAudio();
  if(ghigIntroAudio){
    ghigIntroAudio.pause();
    try{ghigIntroAudio.currentTime=0;}catch(err){}
  }
  ghigliottinaState={
    pid:player.id,
    puzzle,
    step:0,
    prize:puzzle.prize,
    choices:[],
    finalMode:false,
    finalTime:60,
    message:'Scegli la parola giusta. Ogni errore dimezza il montepremi.'
  };
  goTo('s-ghigliottina');
  renderGhigliottina();
}

function renderGhigliottina(){
  const player=players.find(p=>p.id===ghigliottinaState.pid);
  const puzzle=ghigliottinaState.puzzle;
  const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  setText('ghig-player',player?.name||'Giocatore');
  setText('ghig-prize',formatGhigliottinaPrize(ghigliottinaState.prize));
  setText('ghig-step',`${Math.min((ghigliottinaState.step||0)+1,5)} / 5`);
  setText('ghig-time',ghigliottinaState.finalMode?`${ghigliottinaState.finalTime}s`:'--');
  setText('ghig-message',ghigliottinaState.message||'');
  const clues=document.getElementById('ghig-clues');
  if(clues){
    clues.innerHTML=(puzzle?.pairs||[]).map((pair,idx)=>{
      const choice=ghigliottinaState.choices?.[idx];
      const word=choice?.correct||'?';
      const status=choice?choice.ok?'ok':'wrong':'pending';
      return `<div class="ghig-clue ${status}">
        <span>${idx+1}</span>
        <strong>${escapeHtml(word)}</strong>
      </div>`;
    }).join('');
  }
  const pairBox=document.getElementById('ghig-pair');
  const finalBox=document.getElementById('ghig-final');
  if(!pairBox||!finalBox||!puzzle)return;
  if(ghigliottinaState.finalMode){
    pairBox.style.display='none';
    finalBox.style.display='grid';
    const answer=document.getElementById('ghig-answer');
    if(answer&&!answer.dataset.ready){
      answer.value='';
      answer.dataset.ready='1';
      setTimeout(()=>answer.focus(),50);
    }
    return;
  }
  finalBox.style.display='none';
  const pair=puzzle.pairs[ghigliottinaState.step];
  if(!pair){
    startGhigliottinaFinal();
    return;
  }
  pairBox.style.display='grid';
  pairBox.innerHTML=pair.options.map(word=>`<button class="ghig-word" onclick="selectGhigliottinaWord('${escapeHtml(word)}')">${escapeHtml(word)}</button>`).join('');
  const answer=document.getElementById('ghig-answer');
  if(answer)delete answer.dataset.ready;
}

function selectGhigliottinaWord(word){
  const puzzle=ghigliottinaState.puzzle;
  const pair=puzzle?.pairs?.[ghigliottinaState.step];
  if(!pair||ghigliottinaState.finalMode)return;
  const ok=normalizeGhigliottinaAnswer(word)===normalizeGhigliottinaAnswer(pair.correct);
  if(!ok)ghigliottinaState.prize=Math.floor(ghigliottinaState.prize/2);
  ghigliottinaState.choices.push({selected:word,correct:pair.correct,ok});
  ghigliottinaState.message=ok
    ? `Esatto: ${pair.correct}. Il montepremi resta ${formatGhigliottinaPrize(ghigliottinaState.prize)}.`
    : `Era ${pair.correct}. Montepremi dimezzato a ${formatGhigliottinaPrize(ghigliottinaState.prize)}.`;
  ghigliottinaState.step++;
  if(ghigliottinaState.step>=5){
    renderGhigliottina();
    setTimeout(startGhigliottinaFinal,650);
    return;
  }
  renderGhigliottina();
}

function startGhigliottinaFinal(){
  if(ghigliottinaState.finalMode)return;
  ghigliottinaState.finalMode=true;
  ghigliottinaState.finalTime=60;
  ghigliottinaState.message='Ora scrivi la parola che lega i cinque indizi.';
  clearGhigliottinaTimer();
  startGhigliottinaTheme();
  ghigliottinaState.timerId=setInterval(()=>{
    ghigliottinaState.finalTime--;
    renderGhigliottina();
    if(ghigliottinaState.finalTime<=0){
      endGhigliottina(false);
    }
  },1000);
  renderGhigliottina();
}

function submitGhigliottinaAnswer(){
  const answer=document.getElementById('ghig-answer')?.value||'';
  const ok=normalizeGhigliottinaAnswer(answer)===normalizeGhigliottinaAnswer(ghigliottinaState.puzzle?.answer);
  endGhigliottina(ok);
}

function endGhigliottina(won=false){
  clearGhigliottinaTimer();
  stopGhigliottinaAudio();
  const player=players.find(p=>p.id===ghigliottinaState.pid);
  const prize=won?ghigliottinaState.prize:0;
  const points=won?Math.max(1,Math.round(prize/10000)):0;
  if(player&&points>0)awardPlayerPoints(player.id,points,'ghigliottina');
  document.getElementById('win-name').textContent=player?.name||'Giocatore';
  document.getElementById('win-sub').textContent=won
    ? `Hai vinto ${formatGhigliottinaPrize(prize)}. La parola era ${ghigliottinaState.puzzle.answer}.`
    : `La parola era ${ghigliottinaState.puzzle?.answer||'?'}. Montepremi non assegnato.`;
  document.getElementById('win-scores').innerHTML=`<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Risultato Ghigliottina</div>
    <div class="sc-row">
      <div class="sc-rank">✂</div>
      <div class="sc-name">${escapeHtml(player?.name||'Giocatore')}</div>
      <div class="sc-pts">${won?formatGhigliottinaPrize(prize):'0 EUR'}</div>
    </div>`;
  recordCompletedGame('ghigliottina',won&&player?.uid?[player.uid]:[]);
  ghigliottinaState={};
  goTo('s-win');
}

/* ══════════════════════════════
   AFFARI TUOI
══════════════════════════════ */
const AFFARI_PRIZES=[0,1,5,10,20,50,75,100,200,500,1000,5000,10000,15000,20000,30000,50000,75000,100000,300000];
const AFFARI_ROUNDS=[6,5,4,3,2,1];
const AFFARI_REGIONS=[
  'Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna',
  'Friuli V.G.','Lazio','Liguria','Lombardia','Marche',
  'Molise','Piemonte','Puglia','Sardegna','Sicilia',
  'Toscana','Trentino-A.A.','Umbria','Valle d Aosta','Veneto'
];
let affariState={};
let affariScene=null;
let affariAudio=null;
let affariAudioUnlocked=false;
let affariAudioUnlocking=false;
let affariPreparedAudio=null;
let affariPreparedAudioTimer=null;
let affariOutcomeAudioKeepAliveUntil=0;

function formatMoney(value){
  return `${Math.round(value).toLocaleString('it-IT')} €`;
}

function shuffleCopy(items){
  const arr=[...items];
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function speakMystery(text){
  if(!('speechSynthesis' in window)||!text)return;
  window.speechSynthesis.cancel();
  const msg=new SpeechSynthesisUtterance(text);
  const voices=window.speechSynthesis.getVoices?.()||[];
  const italian=voices.find(v=>/it/i.test(v.lang))||voices[0];
  if(italian)msg.voice=italian;
  msg.lang=italian?.lang||'it-IT';
  msg.rate=.86;
  msg.pitch=.72;
  window.speechSynthesis.speak(msg);
}

function stopAffariAudio(force=false){
  if(!force&&Date.now()<affariOutcomeAudioKeepAliveUntil)return;
  if(force)affariOutcomeAudioKeepAliveUntil=0;
  const audio=affariAudio||document.getElementById('affari-audio');
  if(affariPreparedAudioTimer){
    clearTimeout(affariPreparedAudioTimer);
    affariPreparedAudioTimer=null;
  }
  affariPreparedAudio=null;
  if(!audio)return;
  audio.pause();
  audio.currentTime=0;
}

function unlockAffariAudio(){
  if(affariAudioUnlocked||affariAudioUnlocking)return;
  const audio=document.getElementById('affari-audio');
  if(!audio)return;
  affariAudioUnlocking=true;
  affariAudio=audio;
  const unlockSrc='Music theme/aua_errore.mp3';
  audio.muted=true;
  audio.src=unlockSrc;
  audio.currentTime=0;
  const attempt=audio.play();
  const finishUnlock=success=>{
    affariAudioUnlocking=false;
    const currentSrc=audio.currentSrc||audio.src||'';
    if(currentSrc.endsWith(encodeURI(unlockSrc))||currentSrc.endsWith(unlockSrc)){
      audio.pause();
      audio.currentTime=0;
      audio.muted=false;
    }
    if(success)affariAudioUnlocked=true;
  };
  if(attempt&&typeof attempt.then==='function'){
    attempt.then(()=>finishUnlock(true)).catch(()=>{
      affariAudioUnlocking=false;
      audio.muted=false;
    });
  }else{
    finishUnlock(true);
  }
}

function playAffariAudio(src,{volume=.85,duration=5200,startAt=0}={}){
  stopAffariAudio(true);
  if(!src)return Promise.resolve();
  return new Promise(resolve=>{
    const audio=document.getElementById('affari-audio')||new Audio();
    affariAudio=audio;
    audio.muted=false;
    audio.src=src;
    audio.load();
    audio.volume=volume;
    affariOutcomeAudioKeepAliveUntil=Date.now()+duration;
    try{audio.currentTime=startAt;}catch(err){}
    let done=false;
    const finish=()=>{
      if(done)return;
      done=true;
      audio.removeEventListener('ended',finish);
      audio.removeEventListener('error',finish);
      audio.pause();
      affariOutcomeAudioKeepAliveUntil=0;
      resolve();
    };
    audio.addEventListener('ended',finish);
    audio.addEventListener('error',finish);
    const attempt=audio.play();
    if(attempt&&typeof attempt.catch==='function')attempt.catch(finish);
    setTimeout(finish,duration);
  });
}

function playAffariSuspense(){
  return new Promise(resolve=>{
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext){
      setTimeout(resolve,1300);
      return;
    }
    const ctx=new AudioContext();
    const master=ctx.createGain();
    const osc=ctx.createOscillator();
    const tremolo=ctx.createOscillator();
    const tremoloGain=ctx.createGain();
    master.gain.setValueAtTime(.0001,ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(.14,ctx.currentTime+.2);
    master.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.55);
    osc.type='sawtooth';
    osc.frequency.setValueAtTime(96,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(176,ctx.currentTime+1.45);
    tremolo.type='sine';
    tremolo.frequency.value=9;
    tremoloGain.gain.value=.06;
    tremolo.connect(tremoloGain);
    tremoloGain.connect(master.gain);
    osc.connect(master);
    master.connect(ctx.destination);
    osc.start();
    tremolo.start();
    setTimeout(()=>{
      osc.stop();
      tremolo.stop();
      ctx.close().catch(()=>{});
      resolve();
    },1600);
  });
}

function playAffariOutcomeSound(isGood){
  if(isGood){
    const tracks=Array.isArray(SARABANDA_TRACKS)?SARABANDA_TRACKS:[];
    const track=tracks[Math.floor(Math.random()*tracks.length)];
    return playAffariAudio(track?.src,{volume:.72,duration:5600,startAt:8});
  }
  return playAffariAudio('Music theme/aua_errore.mp3',{volume:.9,duration:3200});
}

function getAffariOutcomeAudioConfig(isGood){
  if(isGood){
    const tracks=Array.isArray(SARABANDA_TRACKS)?SARABANDA_TRACKS:[];
    const track=tracks[Math.floor(Math.random()*tracks.length)];
    return {src:track?.src,volume:.72,duration:5600,startAt:8};
  }
  return {src:'Music theme/aua_errore.mp3',volume:.9,duration:3200,startAt:0};
}

function prepareAffariOutcomeSound(isGood){
  const config=getAffariOutcomeAudioConfig(isGood);
  if(!config.src)return null;
  affariAudioUnlocking=false;
  stopAffariAudio(true);
  const audio=document.getElementById('affari-audio')||new Audio();
  affariAudio=audio;
  affariPreparedAudio={audio,config,blocked:false};
  audio.muted=true;
  audio.volume=config.volume;
  audio.src=config.src;
  audio.load();
  try{audio.currentTime=config.startAt||0;}catch(err){}
  const attempt=audio.play();
  if(attempt&&typeof attempt.catch==='function'){
    attempt.catch(()=>{
      if(affariPreparedAudio?.audio===audio)affariPreparedAudio.blocked=true;
    });
  }
  return affariPreparedAudio;
}

function releaseAffariOutcomeSound(prepared,isGood=false){
  const active=prepared||affariPreparedAudio;
  if(!active?.audio||active.blocked||active.audio.paused){
    return playAffariOutcomeSound(isGood);
  }
  const {audio,config}=active;
  affariPreparedAudio=null;
  audio.volume=config.volume;
  affariOutcomeAudioKeepAliveUntil=Date.now()+config.duration;
  audio.muted=false;
  const resumeAttempt=audio.play();
  if(resumeAttempt&&typeof resumeAttempt.catch==='function'){
    resumeAttempt.catch(()=>playAffariOutcomeSound(isGood));
  }
  if(affariPreparedAudioTimer)clearTimeout(affariPreparedAudioTimer);
  affariPreparedAudioTimer=setTimeout(()=>{
    if(audio===affariAudio){
      audio.pause();
      try{audio.currentTime=0;}catch(err){}
    }
    affariOutcomeAudioKeepAliveUntil=0;
    affariPreparedAudioTimer=null;
  },config.duration);
  return Promise.resolve();
}

function showAffariPrizeAlert(pkg,isGood){
  document.getElementById('affari-reveal-alert')?.remove();
  affariState.studioReveal={pkg,isGood,until:performance.now()+2600};
  updateAffariStudioWall();
}

function getAffariRemaining(){
  return (affariState.packages||[]).filter(pkg=>!pkg.opened);
}

function getAffariOpenable(){
  return (affariState.packages||[]).filter(pkg=>!pkg.opened&&pkg.num!==affariState.ownNum);
}

function calculateAffariOffer(){
  const remaining=getAffariRemaining();
  const average=remaining.reduce((sum,pkg)=>sum+pkg.prize,0)/Math.max(1,remaining.length);
  const progress=affariState.roundIndex/Math.max(1,AFFARI_ROUNDS.length-1);
  const factor=.42+progress*.36+(Math.random()*.16-.08);
  const rounded=Math.max(1,Math.round((average*factor)/500)*500);
  return rounded;
}

function renderAffariPrizes(){
  const el=document.getElementById('affari-prizes');
  if(!el)return;
  const opened=new Set((affariState.packages||[]).filter(pkg=>pkg.opened).map(pkg=>pkg.prize));
  el.innerHTML=[...AFFARI_PRIZES].sort((a,b)=>a-b).map(value=>`
    <div class="affari-prize ${opened.has(value)?'opened':''}">${formatMoney(value)}</div>
  `).join('');
}

function renderAffariFallback(){
  const el=document.getElementById('affari-fallback');
  if(!el)return;
  el.innerHTML=(affariState.packages||[]).map(pkg=>`
    <div class="affari-package-wrap">
      <button class="affari-package ${pkg.opened?'opened':''} ${pkg.num===affariState.ownNum?'own':''} ${pkg.justOpened?'reveal':''} ${affariState.phase==='reveal'?'locked':''}"
        type="button" onclick="chooseAffariPackage(${pkg.num})">
        ${pkg.opened?formatMoney(pkg.prize):pkg.num}
      </button>
      <div class="affari-region">${escapeHtml(pkg.region||'')}</div>
    </div>
  `).join('');
}

function makeAffariLabelTexture(text,sub='',color='#ffffff'){
  if(!window.THREE)return null;
  const canvas=document.createElement('canvas');
  canvas.width=320;canvas.height=200;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='rgba(0,0,0,0)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(248,237,210,.95)';
  ctx.fillRect(56,42,208,78);
  ctx.strokeStyle='rgba(0,0,0,.22)';
  ctx.lineWidth=5;
  ctx.strokeRect(56,42,208,78);
  ctx.fillStyle=color;
  ctx.font='900 78px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(text,160,80);
  if(sub){
    ctx.font='900 24px Arial';
    ctx.fillText(sub.toUpperCase(),160,148);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.needsUpdate=true;
  return texture;
}

function makeAffariPlaqueTexture(text){
  if(!window.THREE)return null;
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ead8b6';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='rgba(120,82,42,.22)';
  for(let i=0;i<12;i++){
    ctx.fillRect(Math.random()*canvas.width,Math.random()*canvas.height,12,8);
  }
  ctx.strokeStyle='rgba(76,49,26,.45)';
  ctx.lineWidth=8;
  ctx.strokeRect(8,8,canvas.width-16,canvas.height-16);
  ctx.fillStyle='#1c1a20';
  ctx.font='900 48px Georgia';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(String(text||'').toUpperCase(),canvas.width/2,canvas.height/2+4,canvas.width-42);
  const texture=new THREE.CanvasTexture(canvas);
  texture.needsUpdate=true;
  return texture;
}

function makeAffariStudioTexture(reveal=null){
  if(!window.THREE)return null;
  const canvas=document.createElement('canvas');
  canvas.width=1600;canvas.height=720;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,0,canvas.height);
  bg.addColorStop(0,'#083b66');
  bg.addColorStop(.55,'#052d52');
  bg.addColorStop(1,'#041726');
  ctx.fillStyle=bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle='rgba(18,174,232,.16)';
  for(let x=60;x<canvas.width;x+=180){
    ctx.fillRect(x,70,92,520);
  }
  ctx.strokeStyle='rgba(255,255,255,.12)';
  ctx.lineWidth=4;
  for(let x=0;x<=canvas.width;x+=200){
    ctx.beginPath();
    ctx.moveTo(x,0);
    ctx.lineTo(x+60,canvas.height);
    ctx.stroke();
  }

  ctx.strokeStyle='rgba(245,197,24,.58)';
  ctx.lineWidth=9;
  [900,1080,1260].forEach((radius,i)=>{
    ctx.beginPath();
    ctx.ellipse(canvas.width/2,canvas.height+360+i*38,radius,560+i*40,0,Math.PI*1.1,Math.PI*1.9);
    ctx.stroke();
  });

  ctx.strokeStyle='rgba(34,211,255,.48)';
  ctx.lineWidth=5;
  for(let y=105;y<canvas.height-90;y+=95){
    ctx.beginPath();
    ctx.moveTo(120,y);
    ctx.lineTo(canvas.width-120,y);
    ctx.stroke();
  }

  const glow=ctx.createRadialGradient(canvas.width/2,330,40,canvas.width/2,330,470);
  glow.addColorStop(0,'rgba(245,197,24,.25)');
  glow.addColorStop(1,'rgba(245,197,24,0)');
  ctx.fillStyle=glow;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const revealColor=reveal?(reveal.isGood?'#2ECC71':'#ff4d4d'):null;
  ctx.fillStyle=reveal?'rgba(5,23,38,.88)':'rgba(5,23,38,.72)';
  ctx.strokeStyle=reveal?revealColor:'rgba(245,197,24,.62)';
  ctx.lineWidth=8;
  const plaqueW=reveal?760:520,plaqueH=reveal?230:120,plaqueX=(canvas.width-plaqueW)/2,plaqueY=reveal?50:68;
  ctx.roundRect(plaqueX,plaqueY,plaqueW,plaqueH,18);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  if(reveal){
    ctx.fillStyle='rgba(255,255,255,.82)';
    ctx.font='900 30px Arial';
    ctx.fillText(`PACCO ${reveal.pkg.num} - ${String(reveal.pkg.region||'').toUpperCase()}`,canvas.width/2,plaqueY+46);
    ctx.fillStyle=revealColor;
    ctx.shadowColor=revealColor;
    ctx.shadowBlur=26;
    ctx.font='900 112px Bebas Neue, Arial';
    ctx.fillText(formatMoney(reveal.pkg.prize),canvas.width/2,plaqueY+142);
    ctx.shadowBlur=0;
  }else{
    ctx.fillStyle='#F5C518';
    ctx.font='900 72px Bebas Neue, Arial';
    ctx.fillText('AFFARI TUOI',canvas.width/2,plaqueY+plaqueH/2+5);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.needsUpdate=true;
  return texture;
}

function updateAffariStudioWall(){
  if(!affariScene?.studioWall)return;
  const reveal=affariState.studioReveal&&performance.now()<affariState.studioReveal.until
    ? affariState.studioReveal
    : null;
  affariScene.studioWall.material.map?.dispose?.();
  affariScene.studioWall.material.map=makeAffariStudioTexture(reveal);
  affariScene.studioWall.material.needsUpdate=true;
}

function initAffariThree(){
  const canvas=document.getElementById('affari-canvas');
  const fallback=document.getElementById('affari-fallback');
  if(!canvas||!window.THREE)return null;
  if(fallback)fallback.style.display='none';
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);
  camera.position.set(0,5.9,17.2);
  camera.lookAt(0,.18,-1.7);
  scene.add(new THREE.AmbientLight(0xffffff,.62));
  const key=new THREE.SpotLight(0xffdf86,1.5,30,Math.PI/5,.3);
  key.position.set(0,10,7);
  scene.add(key);
  const side=new THREE.PointLight(0x3498db,.8,24);
  side.position.set(-7,3,4);
  scene.add(side);
  const studioTexture=makeAffariStudioTexture();
  const studioWall=new THREE.Mesh(
    new THREE.PlaneGeometry(16.8,7.6),
    new THREE.MeshBasicMaterial({map:studioTexture,transparent:true,side:THREE.DoubleSide})
  );
  studioWall.position.set(0,2.08,-5.35);
  scene.add(studioWall);
  return {renderer,scene,camera,objects:[],pallets:[],studioWall,started:false};
}

function buildAffariThreePackages(){
  if(!affariScene)return;
  affariScene.objects.forEach(obj=>affariScene.scene.remove(obj.group));
  affariScene.pallets.forEach(pallet=>affariScene.scene.remove(pallet));
  affariScene.objects=[];
  affariScene.pallets=[];
  const boxGeo=new THREE.BoxGeometry(.92,.7,.64);
  const benchGeo=new THREE.BoxGeometry(1.25,.38,.95);
  const benchMat=new THREE.MeshStandardMaterial({color:0x078ac5,roughness:.38,metalness:.12});
  (affariState.packages||[]).forEach((pkg,i)=>{
    const count=affariState.packages.length||20;
    const angle=-Math.PI*.82+(Math.PI*1.64)*(i/(count-1));
    const radiusX=8.85;
    const radiusZ=4.15;
    const x=Math.sin(angle)*radiusX;
    const z=-Math.cos(angle)*radiusZ+.9;
    const yaw=-angle*.72;
    const mat=new THREE.MeshStandardMaterial({
      color:pkg.opened?0x3a3a4a:(pkg.num===affariState.ownNum?0x1f9d61:0x0b8fc4),
      roughness:.34,
      metalness:.22
    });
    const bench=new THREE.Mesh(benchGeo,benchMat);
    bench.position.set(x,-.76,z+.12);
    bench.rotation.y=yaw;
    affariScene.scene.add(bench);
    affariScene.pallets.push(bench);
    const plaqueTexture=makeAffariPlaqueTexture(pkg.region);
    const plaque=new THREE.Mesh(
      new THREE.PlaneGeometry(1.08,.34),
      new THREE.MeshBasicMaterial({map:plaqueTexture,transparent:true})
    );
    plaque.position.set(0,-.03,.481);
    plaque.rotation.x=-.03;
    bench.add(plaque);
    const box=new THREE.Mesh(boxGeo,mat);
    const group=new THREE.Group();
    group.position.set(x,-.16,z-.05);
    group.rotation.y=yaw;
    box.userData.num=pkg.num;
    group.add(box);
    const labelTexture=makeAffariLabelTexture(
      pkg.opened?formatMoney(pkg.prize).replace(' €',''):String(pkg.num),
      '',
      pkg.opened?'#5f6370':'#1b1b24'
    );
    const label=new THREE.Mesh(
      new THREE.PlaneGeometry(.72,.42),
      new THREE.MeshBasicMaterial({map:labelTexture,transparent:true})
    );
    label.position.set(0,0,.326);
    group.add(label);
    const seal=new THREE.Mesh(
      new THREE.CylinderGeometry(.09,.09,.035,24),
      new THREE.MeshBasicMaterial({color:0xe83e5c})
    );
    seal.position.set(.32,.04,.346);
    seal.rotation.x=Math.PI/2;
    group.add(seal);
    const handle=new THREE.Mesh(
      new THREE.TorusGeometry(.25,.026,8,24,Math.PI),
      new THREE.MeshStandardMaterial({color:0xe9f3f7,roughness:.25,metalness:.45})
    );
    handle.position.set(0,.38,0);
    handle.rotation.z=Math.PI;
    group.add(handle);
    affariScene.scene.add(group);
    affariScene.objects.push({group,box,num:pkg.num,baseY:0});
  });
}

function resizeAffariThree(){
  if(!affariScene)return;
  const canvas=document.getElementById('affari-canvas');
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  affariScene.renderer.setSize(rect.width,rect.height,false);
  affariScene.camera.aspect=rect.width/rect.height;
  affariScene.camera.updateProjectionMatrix();
}

function animateAffariThree(){
  if(!affariScene||!document.getElementById('s-affari')?.classList.contains('active')){
    if(affariScene)affariScene.started=false;
    return;
  }
  affariScene.started=true;
  resizeAffariThree();
  const now=performance.now()/1000;
  affariScene.objects.forEach((obj,i)=>{
    const pkg=affariState.packages?.find(p=>p.num===obj.num);
    obj.group.position.y=Math.sin(now*1.4+i*.45)*.045;
    obj.group.rotation.x=pkg?.justOpened?Math.sin(now*12)*.12:0;
    obj.group.rotation.y+=pkg?.opened ? .003 : .006;
  });
  if(affariState.studioReveal&&now*1000>affariState.studioReveal.until){
    affariState.studioReveal=null;
    updateAffariStudioWall();
  }
  affariScene.renderer.render(affariScene.scene,affariScene.camera);
  requestAnimationFrame(animateAffariThree);
}

function renderAffariThree(){
  const canvas=document.getElementById('affari-canvas');
  const fallback=document.getElementById('affari-fallback');
  if(!window.THREE){
    if(canvas)canvas.style.display='none';
    if(fallback)fallback.style.display='grid';
    renderAffariFallback();
    return;
  }
  if(canvas)canvas.style.display='block';
  if(!affariScene)affariScene=initAffariThree();
  buildAffariThreePackages();
  if(!affariScene.started)requestAnimationFrame(animateAffariThree);
}

function setupAffariCanvasClick(){
  const canvas=document.getElementById('affari-canvas');
  if(!canvas||canvas.dataset.affariClickBound==='1')return;
  canvas.dataset.affariClickBound='1';
  canvas.addEventListener('click',event=>{
    if(!affariScene||!window.THREE)return;
    const rect=canvas.getBoundingClientRect();
    const mouse=new THREE.Vector2(
      ((event.clientX-rect.left)/rect.width)*2-1,
      -(((event.clientY-rect.top)/rect.height)*2-1)
    );
    const raycaster=new THREE.Raycaster();
    raycaster.setFromCamera(mouse,affariScene.camera);
    const hits=raycaster.intersectObjects(affariScene.objects.map(o=>o.box),false);
    if(hits[0]?.object?.userData?.num)chooseAffariPackage(hits[0].object.userData.num);
  });
}

function renderAffari(){
  const player=players.find(p=>p.id===affariState.pid);
  const roundTarget=AFFARI_ROUNDS[affariState.roundIndex]||1;
  const remainingToOpen=Math.max(0,roundTarget-affariState.openedThisRound);
  const playerEl=document.getElementById('affari-player');
  const offerEl=document.getElementById('affari-offer');
  const stepEl=document.getElementById('affari-step');
  const msgEl=document.getElementById('affari-message');
  if(playerEl)playerEl.textContent=player?.name||'Concorrente';
  if(offerEl)offerEl.textContent=affariState.offer?formatMoney(affariState.offer):'—';
  if(stepEl)stepEl.textContent=affariState.step||'Pacchi in studio';
  if(msgEl)msgEl.textContent=affariState.message||'Scegli un pacco.';
  const acceptBtn=document.getElementById('affari-accept');
  const rejectBtn=document.getElementById('affari-reject');
  if(acceptBtn){
    acceptBtn.disabled=!(affariState.phase==='offer'||affariState.phase==='final');
    acceptBtn.textContent=affariState.phase==='final'?'Scopri pacco':'Accetto';
  }
  if(rejectBtn)rejectBtn.disabled=affariState.phase!=='offer';
  const canSwap=affariState.phase==='final'&&getAffariOpenable().length===1;
  document.getElementById('affari-swap').disabled=!canSwap;
  if(affariState.phase==='open'){
    affariState.step=`Apri ${remainingToOpen} ${remainingToOpen===1?'pacco':'pacchi'}`;
    if(stepEl)stepEl.textContent=affariState.step;
  }else if(affariState.phase==='reveal'){
    if(stepEl)stepEl.textContent='Suspense';
  }
  renderAffariPrizes();
  renderAffariFallback();
  renderAffariThree();
}

function beginAffariTuoi(){
  activeStatsGame='affarituoi';
  stopAffariAudio(true);
  affariAudioUnlocked=false;
  affariAudioUnlocking=false;
  const player=players.find(p=>p.id===selAffariPid)||players[0];
  if(!player)return;
  const prizes=shuffleCopy(AFFARI_PRIZES);
  const regions=shuffleCopy(AFFARI_REGIONS);
  affariState={
    pid:player.id,
    packages:prizes.map((prize,i)=>({num:i+1,region:regions[i]||'',prize,opened:false,justOpened:false})),
    ownNum:null,
    phase:'choose',
    roundIndex:0,
    openedThisRound:0,
    offer:0,
    step:'Scelta del pacco',
    message:'Scegli il tuo pacco. Da qui comincia la partita.'
  };
  goTo('s-affari');
  setupAffariCanvasClick();
  renderAffari();
  speakMystery(`Benvenuto ${player.name}. Scegli il tuo pacco.`);
}

function chooseAffariPackage(num){
  if(!affariState.packages?.length)return;
  if(affariState.phase==='reveal')return;
  if(affariState.phase==='choose'){
    affariState.ownNum=num;
    const pkg=affariState.packages.find(p=>p.num===num);
    affariState.phase='open';
    affariState.message=`Hai scelto il pacco ${num}, ${pkg?.region||''}. Ora apriamo i primi pacchi.`;
    affariState.step='Primo round';
    speakMystery(`Pacco numero ${num}, ${pkg?.region||''}. Bene. Ora apriamo i primi pacchi.`);
    renderAffari();
    return;
  }
  if(affariState.phase==='open')openAffariPackage(num);
}

async function openAffariPackage(num){
  const pkg=affariState.packages.find(p=>p.num===num);
  if(!pkg||pkg.opened||pkg.num===affariState.ownNum||affariState.phase!=='open')return;
  affariState.phase='reveal';
  affariState.step='Suspense';
  affariState.message=`Il pacco ${pkg.num}, ${pkg.region}, sta per essere aperto...`;
  renderAffari();
  const isGood=pkg.prize<=1000;
  const preparedAudio=prepareAffariOutcomeSound(isGood);
  await playAffariSuspense();
  pkg.opened=true;
  pkg.justOpened=true;
  affariState.openedThisRound++;
  affariState.offer=0;
  const good=isGood?'Ottimo colpo':'Questo fa male';
  affariState.message=`Pacco ${pkg.num}, ${pkg.region}: ${good}.`;
  showAffariPrizeAlert(pkg,isGood);
  releaseAffariOutcomeSound(preparedAudio,isGood);
  setTimeout(()=>{pkg.justOpened=false;renderAffari();},700);
  const openable=getAffariOpenable();
  const roundTarget=AFFARI_ROUNDS[affariState.roundIndex]||1;
  if(openable.length===1){
    affariState.phase='final';
    affariState.step='Finale';
    affariState.message=`Restano il tuo pacco ${affariState.ownNum} e il pacco ${openable[0].num}, ${openable[0].region}. Puoi cambiare o scoprire cosa hai.`;
    speakMystery('Siamo al finale. Cambio o tieni il tuo pacco?');
  }else if(affariState.openedThisRound>=roundTarget){
    affariState.phase='offer';
    affariState.offer=calculateAffariOffer();
    affariState.step='Chiamata';
    affariState.message=`L'uomo misterioso offre ${formatMoney(affariState.offer)}. Accetti o rifiuti?`;
    speakMystery(`L'uomo misterioso offre ${formatMoney(affariState.offer)}. Accetti o rifiuti?`);
  }else{
    affariState.phase='open';
    affariState.step='Apertura pacchi';
  }
  renderAffari();
}

function acceptAffariOffer(){
  if(affariState.phase==='final'){
    revealAffariFinal();
    return;
  }
  if(affariState.phase!=='offer')return;
  finishAffariGame(affariState.offer,'offerta accettata');
}

function rejectAffariOffer(){
  if(affariState.phase!=='offer')return;
  affariState.roundIndex++;
  affariState.openedThisRound=0;
  affariState.offer=0;
  affariState.phase='open';
  affariState.step='Offerta rifiutata';
  affariState.message='Offerta rifiutata. Si continua ad aprire pacchi.';
  speakMystery('Offerta rifiutata. Andiamo avanti.');
  renderAffari();
}

function swapAffariPackage(){
  if(affariState.phase!=='final')return;
  const other=getAffariOpenable()[0];
  if(!other)return;
  const old=affariState.ownNum;
  const oldPkg=affariState.packages.find(pkg=>pkg.num===old);
  affariState.ownNum=other.num;
  affariState.message=`Cambio effettuato: lasci il pacco ${old}, ${oldPkg?.region||''}, e prendi il pacco ${other.num}, ${other.region}.`;
  speakMystery(`Cambio effettuato. Ora il tuo pacco e il numero ${other.num}, ${other.region}.`);
  renderAffari();
}

async function revealAffariFinal(){
  if(affariState.phase!=='final')return;
  const own=affariState.packages.find(pkg=>pkg.num===affariState.ownNum);
  if(!own)return;
  affariState.phase='reveal';
  affariState.step='Pacco finale';
  affariState.message=`Apriamo il tuo pacco ${own.num}, ${own.region}...`;
  renderAffari();
  const isGood=own.prize>=10000;
  const preparedAudio=prepareAffariOutcomeSound(isGood);
  await playAffariSuspense();
  own.opened=true;
  own.justOpened=true;
  showAffariPrizeAlert(own,isGood);
  releaseAffariOutcomeSound(preparedAudio,isGood);
  finishAffariGame(own.prize,'pacco finale');
}

function finishAffariGame(amount,reason){
  const player=players.find(p=>p.id===affariState.pid);
  const points=Math.max(1,Math.round(amount/10000));
  if(player)awardPlayerPoints(player.id,points,'affari-tuoi');
  const own=affariState.packages?.find(pkg=>pkg.num===affariState.ownNum);
  document.getElementById('win-name').textContent=player?.name||'Concorrente';
  document.getElementById('win-sub').textContent=`${reason}: ${formatMoney(amount)} (${points} pt).`;
  document.getElementById('win-scores').innerHTML=`<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Risultato Affari Tuoi</div>
    <div class="sc-row">
      <div class="sc-rank">📦</div>
      <div class="sc-name">Pacco ${own?.num||affariState.ownNum||'—'}${own?.region?` - ${escapeHtml(own.region)}`:''}</div>
      <div class="sc-pts">${formatMoney(own?.prize||amount)}</div>
    </div>
    <div class="sc-row">
      <div class="sc-rank">€</div>
      <div class="sc-name">${escapeHtml(player?.name||'Concorrente')}</div>
      <div class="sc-pts">${points} pt</div>
    </div>`;
  recordCompletedGame('affarituoi',player?.uid?[player.uid]:[]);
  renderHomeLeaderboard();
  speakMystery(`Partita finita. Hai vinto ${formatMoney(amount)}.`);
  affariState={};
  goTo('s-win');
}

/* ══════════════════════════════
   REAZIONE A CATENA
══════════════════════════════ */
let chainState={};let chainInt=null;

function clearChainTimer(){
  clearInterval(chainInt);
  chainInt=null;
}

function normalizeChainWord(text){
  return (text||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Z0-9]/gi,'')
    .toUpperCase();
}

async function beginChain(options={}){
  activeStatsGame='catena';
  if(!selChainP1||!selChainP2||selChainP1===selChainP2)return;
  clearChainTimer();
  if(options.sessionId)listenGameSession(options.sessionId);
  const p1=players.find(p=>p.id===selChainP1);
  const p2=players.find(p=>p.id===selChainP2);
  if(!p1||!p2)return;
  const rounds=await loadQuestionBank('catena',CHAIN_ROUNDS);
  const round=options.round||rounds[Math.floor(Math.random()*rounds.length)];
  chainState={
    pids:[selChainP1,selChainP2],
    puids:[p1.uid||null,p2.uid||null],
    start:round.start,
    words:round.words,
    idx:0,
    max:getTimer('chain'),
    left:getTimer('chain'),
    revealed:round.words.map(()=>0),
    solved:round.words.map(()=>false),
    blocked:false
  };
  if(!options.fromInvite&&selectedPlayMode==='online'){
    const sessionId=await createGameSession('catena',serializeChainState());
    if(sessionId)listenGameSession(sessionId);
    sendGameInvites('catena',{p1Uid:p1.uid||null,p2Uid:p2.uid||null,round,sessionId});
  }
  document.getElementById('chain-pair').textContent=`${p1.name} + ${p2.name}`;
  document.getElementById('chain-start-word').textContent=round.start;
  renderChainPlayers();
  renderChainRows();
  setChainMessage('Partite dalla parola data e trovate il primo collegamento.');
  goTo('s-chain');
  startChainTimer();
  syncChainState();
}

function serializeChainState(){
  if(!chainState?.words)return null;
  return {
    puids:chainState.puids||chainState.pids?.map(pid=>players.find(p=>p.id===pid)?.uid||null)||[],
    names:(chainState.pids||[]).map(pid=>players.find(p=>p.id===pid)?.name||'Giocatore'),
    start:chainState.start,
    words:chainState.words,
    idx:chainState.idx||0,
    max:chainState.max,
    left:chainState.left,
    revealed:chainState.revealed||[],
    solved:chainState.solved||[],
    blocked:!!chainState.blocked,
    message:document.getElementById('chain-message')?.textContent||''
  };
}

function syncChainState(){
  const state=serializeChainState();
  if(state)updateGameSession(state);
}

function applyRemoteChainState(state){
  if(!state)return;
  applyingRemoteSessionState=true;
  chainState={
    pids:(state.puids||[]).map((uid,i)=>getPlayerIdByUid(uid)||players[i]?.id||i+1),
    puids:state.puids||[],
    start:state.start,
    words:state.words||[],
    idx:state.idx||0,
    max:state.max||getTimer('chain'),
    left:state.left||0,
    revealed:state.revealed||[],
    solved:state.solved||[],
    blocked:!!state.blocked
  };
  clearChainTimer();
  document.getElementById('chain-pair').textContent=(state.names||[]).join(' + ');
  document.getElementById('chain-start-word').textContent=state.start||'';
  renderChainPlayers();
  renderChainRows();
  updateChainTimer();
  setChainMessage(state.message||'Partita online aggiornata.');
  goTo('s-chain');
  applyingRemoteSessionState=false;
  if(canControlChainOnline()&&!chainState.blocked&&chainState.idx<chainState.words.length)startChainTimer();
}

function canControlChainOnline(){
  if(selectedPlayMode!=='online'||!activeGameSessionId)return true;
  const uid=chainState.puids?.[0]||currentUser?.uid;
  return !uid||uid===currentUser?.uid;
}

function beginTaboo(){
  activeStatsGame='taboo';
  if(!selTabooPid)return;
  const p=players.find(p=>p.id===selTabooPid);
  if(!p)return;
  const seconds=getTabooTimer();
  const now=Date.now();
  database.ref('currentGameState').set({
    mode:'taboo',
    status:'ready',
    wordIndex:-1,
    word:'',
    taboo:[],
    currentPlayer:p.name,
    currentPlayerId:p.id,
    currentPlayerUid:p.uid||null,
    timerSeconds:seconds,
    startedAt:0,
    endsAt:0,
    score:0,
    updatedAt:now
  }).catch(err=>console.error('Errore avvio Taboo:',err));
  window.open('host.html', '_blank');
}

function listenTabooScoreEvents(){
  if(!database||tabooScoreEventsRef)return;
  tabooScoreEventsRef=database.ref('tabooScoreEvents');
  tabooScoreEventsRef.on('child_added',snap=>{
    const id=snap.key;
    if(processedTabooScoreEvents.has(id))return;
    const ev=snap.val()||{};
    if((ev.createdAt||0)<tabooScoreEventsStartedAt)return;
    processedTabooScoreEvents.add(id);
    const points=Number(ev.points)||0;
    if(!points||!ev.playerId)return;
    awardPlayerPoints(Number(ev.playerId),points,'taboo');
    renderPlayers();
    renderTeamSection();
    renderHomeLeaderboard();
    snap.ref.remove().catch(err=>console.error('Errore pulizia evento Taboo:',err));
  });
}

function getChainTeamIds(){
  return [...new Set(chainState.pids.map(pid=>{
    const t=teams.find(tm=>tm.mids.includes(pid));
    return t?t.id:null;
  }).filter(Boolean))];
}

function addChainPairPoints(points){
  chainState.pids.forEach(pid=>{
    awardPlayerPoints(pid,points,'reazione-a-catena',false);
  });
  getChainTeamIds().forEach(tid=>{
    const t=teams.find(tm=>tm.id===tid);
    if(t)t.score+=points;
  });
}

function renderChainPlayers(){
  const el=document.getElementById('chain-players');
  if(!el)return;
  el.innerHTML=chainState.pids.map(pid=>{
    const p=players.find(pl=>pl.id===pid);
    const c=TC[(p?.ci||0)%TC.length];
    return `<div class="chain-player">
      <div class="chain-player-name" style="color:${c.hex}">${p?p.name:'—'}</div>
      <div class="chain-player-score">${p?p.score:0}</div>
    </div>`;
  }).join('');
}

function renderChainRows(){
  const cs=chainState;
  const rows=document.getElementById('chain-rows');
  if(!rows)return;
  rows.innerHTML=cs.words.map((word,i)=>{
    const isActive=i===cs.idx&&!cs.solved[i];
    const val=cs.solved[i]?word:'';
    const disabled=!isActive;
    return `<div class="chain-row">
      <div class="chain-num">${i+1}</div>
      <input class="tf chain-input${cs.solved[i]?' done':isActive?' active':' locked'}" id="chain-input-${i}"
        value="${val}" ${disabled?'disabled':''} placeholder="${isActive?'Scrivi la parola...':'—'}"
        onkeydown="if(event.key==='Enter')submitChainWord()">
    </div>`;
  }).join('');
  document.getElementById('chain-step-label').textContent=`Parola ${Math.min(cs.idx+1,cs.words.length)} / ${cs.words.length}`;
  renderChainHint();
  setTimeout(()=>document.getElementById(`chain-input-${cs.idx}`)?.focus(),0);
}

function renderChainHint(){
  const cs=chainState;
  const el=document.getElementById('chain-hint');
  if(!el)return;
  const word=cs.words[cs.idx]||'';
  const shown=cs.revealed[cs.idx]||0;
  if(!word||cs.solved[cs.idx]){
    el.textContent='';
    return;
  }
  if(!shown){
    el.textContent='Nessun aiuto sbloccato';
    return;
  }
  el.textContent='Aiuto: '+word.split('').map((ch,i)=>i<shown?ch:'_').join(' ');
}

function setChainMessage(text,color='var(--txt)'){
  const el=document.getElementById('chain-message');
  if(!el)return;
  el.textContent=text;
  el.style.color=color;
}

function startChainTimer(){
  clearChainTimer();
  if(!canControlChainOnline())return;
  chainState.left=chainState.max;
  updateChainTimer();
  chainInt=setInterval(()=>{
    if(chainState.blocked)return;
    chainState.left--;
    updateChainTimer();
    syncChainState();
    if(chainState.left<=0){
      missChainWord(true);
    }
  },1000);
}

function updateChainTimer(){
  const cs=chainState;
  const pct=Math.max(0,Math.round(cs.left/cs.max*100));
  const col=cs.left<=5?'#E74C3C':cs.left<=10?'#F5C518':'#2ECC71';
  const bar=document.getElementById('chain-tbar');
  const time=document.getElementById('chain-time');
  if(bar){bar.style.width=pct+'%';bar.style.background=col;}
  if(time){time.textContent=cs.left;time.style.color=col;}
}

function submitChainWord(){
  const cs=chainState;
  if(!canControlChainOnline())return;
  if(cs.blocked||cs.idx>=cs.words.length)return;
  const input=document.getElementById(`chain-input-${cs.idx}`);
  const guess=normalizeChainWord(input?.value);
  const answer=normalizeChainWord(cs.words[cs.idx]);
  if(!guess){
    setChainMessage('Scrivete una parola prima di confermare.', '#F5C518');
    return;
  }
  if(guess!==answer){
    missChainWord(false);
    return;
  }
  cs.solved[cs.idx]=true;
  clearChainTimer();
  setChainMessage(`Giusto: ${cs.words[cs.idx]}!`, '#2ECC71');
  cs.idx++;
  renderChainRows();
  syncChainState();
  if(cs.idx>=cs.words.length){
    completeChain();
    return;
  }
  setTimeout(()=>{
    setChainMessage('Collegate la parola appena trovata alla prossima.');
    startChainTimer();
  },450);
}

function missChainWord(fromTimer=false){
  const cs=chainState;
  if(!canControlChainOnline())return;
  if(cs.blocked||cs.idx>=cs.words.length)return;
  clearChainTimer();
  addChainPairPoints(-2);
  const word=cs.words[cs.idx];
  cs.revealed[cs.idx]=Math.min(word.length,(cs.revealed[cs.idx]||0)+1);
  renderChainPlayers();
  renderHomeLeaderboard();
  renderChainHint();
  syncChainState();
  const input=document.getElementById(`chain-input-${cs.idx}`);
  if(input){
    input.value='';
    input.focus();
  }
  const prefix=fromTimer?'Tempo scaduto.':'Parola sbagliata.';
  if(cs.revealed[cs.idx]>=word.length){
    setChainMessage(`${prefix} Parola svelata: ${word}. Si passa avanti. -2 punti.`, '#E74C3C');
    cs.solved[cs.idx]=true;
    cs.idx++;
    setTimeout(()=>{
      renderChainRows();
      syncChainState();
      if(cs.idx>=cs.words.length)completeChain();
      else startChainTimer();
    },1000);
    return;
  }
  setChainMessage(`${prefix} -2 punti e una lettera sbloccata.`, '#E74C3C');
  startChainTimer();
}

function completeChain(){
  clearChainTimer();
  chainState.blocked=true;
  addChainPairPoints(5);
  renderChainPlayers();
  renderHomeLeaderboard();
  
  setChainMessage('Catena completata! +5 punti alla coppia.', '#2ECC71');
  syncChainState();
  setTimeout(()=>{
    const p1=players.find(p=>p.id===chainState.pids[0]);
    const p2=players.find(p=>p.id===chainState.pids[1]);
    document.getElementById('win-name').textContent=`${p1?.name||'—'} + ${p2?.name||'—'}`;
    document.getElementById('win-sub').textContent='+5 punti per aver chiuso Reazione a Catena!';
    const sorted=[...players].sort((a,b)=>b.score-a.score);
    let html='<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Classifica giocatori</div>';
    html+=sorted.map((pl,i)=>{
      const c=TC[pl.ci%TC.length];const tm=teams.find(t=>t.mids.includes(pl.id));
      return `<div class="sc-row">
        <div class="sc-rank">${i+1}</div>
        <div class="avatar" style="background:${c.light};color:${c.hex};width:24px;height:24px;font-size:.62rem;border-radius:50%;flex-shrink:0">${initials(pl.name)}</div>
        <div class="sc-name">${pl.name}${tm?` <span style="font-size:.68rem;color:var(--mut)">(${tm.name})</span>`:''}</div>
        <div class="sc-pts">${pl.score}</div></div>`;
    }).join('');
    if(teams.length){
      html+='<div style="height:.5rem"></div><div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin:.4rem 0">Squadre</div>';
      html+=[...teams].sort((a,b)=>b.score-a.score).map((tm,i)=>`<div class="sc-row">
        <div class="sc-rank">${i+1}</div>
        <div style="width:10px;height:10px;border-radius:50%;background:${tm.color.hex};flex-shrink:0"></div>
        <div class="sc-name">${tm.name}</div><div class="sc-pts">${tm.score}</div></div>`).join('');
    }
    document.getElementById('win-scores').innerHTML=html;
    recordCompletedGame('catena',[p1?.uid,p2?.uid].filter(Boolean));
    goTo('s-win');
    cleanupOnlineGameArtifacts();
  },900);
}

/* ══════════════════════════════
   SARABANDA
══════════════════════════════ */
let sarabandaState={};
let sarabandaPreviewHandler=null;
let sarabandaEndedHandler=null;
const SARABANDA_PREVIEW_SECONDS=6;

async function beginSarabanda(options={}){
  activeStatsGame='sarabanda';
  if(players.length<2){goTo('s-setup');return;}
  if(options.sessionId)listenGameSession(options.sessionId);
  const tracks=(options.tracks||await loadQuestionBank('sarabanda',SARABANDA_TRACKS)).filter(t=>t&&t.src);
  const playlist=options.tracks?[...tracks].slice(0,5):shuffleArray([...tracks]).slice(0,5);
  if(!playlist.length){
    alert('Aggiungi almeno un brano per Sarabanda.');
    return;
  }
  const saraPlayers=Array.isArray(options.participantUids)&&options.participantUids.length
    ? options.participantUids.map(uid=>players.find(p=>p.uid===uid)).filter(Boolean)
    : players;
  sarabandaState={
    players:saraPlayers.map(p=>({id:p.id,uid:p.uid||null,name:p.name,color:TC[p.ci%TC.length],score:0})),
    tracks:playlist,
    idx:0,
    activePid:saraPlayers[0]?.id||null,
    revealed:false,
    fullPlay:false,
    resumeAt:0,
    message:`Turno di ${saraPlayers[0]?.name||'Giocatore'}. Premi play quando siete pronti.`,
    completed:false
  };
  if(!options.fromInvite&&selectedPlayMode==='online'){
    const sessionId=await createGameSession('sarabanda',serializeSarabandaState());
    if(sessionId)listenGameSession(sessionId);
    sendGameInvites('sarabanda',{
      sessionId,
      tracks:playlist,
      participantUids:sarabandaState.players.map(p=>p.uid).filter(Boolean)
    });
  }
  renderSarabanda();
  goTo('s-sarabanda');
  syncSarabandaState();
}

function serializeSarabandaState(){
  if(!sarabandaState?.players)return null;
  return {
    players:sarabandaState.players.map(p=>({uid:p.uid||null,name:p.name,color:p.color,score:p.score||0})),
    tracks:sarabandaState.tracks||[],
    idx:sarabandaState.idx||0,
    activeUid:sarabandaState.players.find(p=>p.id===sarabandaState.activePid)?.uid||null,
    activeName:sarabandaState.players.find(p=>p.id===sarabandaState.activePid)?.name||null,
    revealed:!!sarabandaState.revealed,
    fullPlay:!!sarabandaState.fullPlay,
    resumeAt:Number(sarabandaState.resumeAt)||0,
    message:sarabandaState.message||'',
    completed:!!sarabandaState.completed
  };
}

function syncSarabandaState(){
  const state=serializeSarabandaState();
  if(state)updateGameSession(state);
}

function applyRemoteSarabandaState(state){
  if(!state)return;
  const previousIdx=sarabandaState?.idx;
  const previousSrc=getCurrentSarabandaTrack()?.src;
  const wasRevealed=!!sarabandaState?.revealed;
  applyingRemoteSessionState=true;
  const mappedPlayers=(state.players||[]).map((rp,i)=>{
    const local=players.find(p=>p.uid&&p.uid===rp.uid);
    return {
      id:local?.id||i+1,
      uid:rp.uid||null,
      name:rp.name||local?.name||'Giocatore',
      color:rp.color||TC[i%TC.length],
      score:rp.score||0
    };
  });
  const active=state.activeUid
    ? mappedPlayers.find(p=>p.uid===state.activeUid)
    : mappedPlayers.find(p=>p.name===state.activeName);
  sarabandaState={
    players:mappedPlayers,
    tracks:state.tracks||[],
    idx:state.idx||0,
    activePid:active?.id||null,
    revealed:!!state.revealed,
    fullPlay:!!state.fullPlay,
    resumeAt:Number(state.resumeAt)||0,
    message:state.message||'',
    completed:!!state.completed
  };
  renderSarabanda();
  goTo('s-sarabanda');
  const currentSrc=getCurrentSarabandaTrack()?.src;
  if(previousIdx!==undefined&&(previousIdx!==sarabandaState.idx||previousSrc!==currentSrc)){
    playSarabandaPreview();
  }else if(!wasRevealed&&sarabandaState.revealed&&sarabandaState.fullPlay){
    playFullSarabandaTrack(true);
  }
  applyingRemoteSessionState=false;
}

function getCurrentSarabandaTrack(){
  return sarabandaState.tracks?.[sarabandaState.idx]||null;
}

function normalizeSarabandaText(text){
  return (text||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Z0-9]/gi,'')
    .toUpperCase();
}

function getSarabandaTextDistance(a,b){
  if(a===b)return 0;
  if(!a)return b.length;
  if(!b)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  const curr=Array(b.length+1).fill(0);
  for(let i=1;i<=a.length;i++){
    curr[0]=i;
    for(let j=1;j<=b.length;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+cost);
    }
    for(let j=0;j<=b.length;j++)prev[j]=curr[j];
  }
  return prev[b.length];
}

function isSarabandaGuessCorrect(guess,track){
  const normalized=normalizeSarabandaText(guess);
  if(!normalized)return false;
  const answers=[track.title,track.artist].map(normalizeSarabandaText).filter(Boolean);
  return answers.some(answer=>{
    const tolerance=answer.length>=10?2:1;
    return answer.includes(normalized)||
      normalized.includes(answer)||
      getSarabandaTextDistance(normalized,answer)<=tolerance;
  });
}

function renderSarabanda(){
  const track=getCurrentSarabandaTrack();
  const audio=document.getElementById('sara-audio');
  if(!track||!audio)return;
  document.getElementById('sara-counter').textContent=`${sarabandaState.idx+1} / ${sarabandaState.tracks.length}`;
  document.getElementById('sara-hidden-title').textContent=sarabandaState.revealed?track.title:'???';
  const active=sarabandaState.players.find(p=>p.id===sarabandaState.activePid);
  document.getElementById('sara-hidden-artist').textContent=sarabandaState.revealed?track.artist:`Turno di ${active?.name||'Giocatore'}`;
  document.getElementById('sara-status').textContent=sarabandaState.revealed?'Soluzione':'Ascolta e indovina';
  if(audio.getAttribute('src')!==track.src){
    audio.src=track.src;
    audio.load();
  }
  setupSarabandaAudioPreview();
  audio.onerror=()=>setSarabandaMessage(`Audio non trovato: ${track.src}`);
  document.getElementById('sara-players').innerHTML=sarabandaState.players.map(p=>`
    <div class="sara-player${p.id===sarabandaState.activePid?' active':''}">
      <div class="sara-player-name" style="color:${p.color.hex}">${escapeHtml(p.name)}</div>
      <div class="sara-player-score">${p.score||0}</div>
    </div>
  `).join('');
  document.getElementById('sara-answer').value='';
  setSarabandaMessage(sarabandaState.message||'');
}

function setupSarabandaAudioPreview(){
  const audio=document.getElementById('sara-audio');
  if(!audio)return;
  if(sarabandaPreviewHandler){
    audio.removeEventListener('timeupdate',sarabandaPreviewHandler);
  }
  if(sarabandaEndedHandler){
    audio.removeEventListener('ended',sarabandaEndedHandler);
  }
  sarabandaPreviewHandler=()=>{
    if(sarabandaState.fullPlay||sarabandaState.revealed)return;
    if(audio.currentTime>=SARABANDA_PREVIEW_SECONDS){
      audio.pause();
      sarabandaState.resumeAt=audio.currentTime;
      setSarabandaMessage(`Anteprima finita: ${SARABANDA_PREVIEW_SECONDS} secondi ascoltati.`);
      syncSarabandaState();
    }
  };
  sarabandaEndedHandler=()=>{
    if(!sarabandaState.fullPlay&&!sarabandaState.revealed)return;
    nextSarabandaTrack();
  };
  audio.addEventListener('timeupdate',sarabandaPreviewHandler);
  audio.addEventListener('ended',sarabandaEndedHandler);
}

function playFullSarabandaTrack(fromResume=false){
  const audio=document.getElementById('sara-audio');
  if(!audio)return;
  sarabandaState.fullPlay=true;
  const resumeAt=fromResume?Number(sarabandaState.resumeAt)||audio.currentTime||0:0;
  audio.currentTime=Math.max(0,resumeAt);
  audio.play().catch(()=>{});
}

function playSarabandaPreview(){
  const audio=document.getElementById('sara-audio');
  if(!audio)return;
  sarabandaState.fullPlay=false;
  sarabandaState.resumeAt=0;
  audio.currentTime=0;
  audio.play().catch(()=>{});
}

function stopSarabandaAudio(){
  const audio=document.getElementById('sara-audio');
  if(!audio)return;
  audio.pause();
  sarabandaState.resumeAt=0;
  try{audio.currentTime=0;}catch(e){}
}

function setSarabandaMessage(text){
  sarabandaState.message=text;
  const el=document.getElementById('sara-message');
  if(el)el.textContent=text;
}

function selectSarabandaPlayer(pid){
  const p=sarabandaState.players.find(pl=>pl.id===pid);
  setSarabandaMessage(p?`Ora il turno e' automatico: sta giocando ${p.name}.`:'');
}

function submitSarabandaAnswer(){
  const track=getCurrentSarabandaTrack();
  if(!track)return;
  const guess=document.getElementById('sara-answer')?.value||'';
  const ok=isSarabandaGuessCorrect(guess,track);
  if(ok)awardSarabandaPoint();
  else wrongSarabandaAnswer();
}

function awardSarabandaPoint(){
  const p=sarabandaState.players.find(pl=>pl.id===sarabandaState.activePid);
  if(!p){
    setSarabandaMessage('Seleziona prima il giocatore che ha risposto.');
    return;
  }
  p.score=(p.score||0)+1;
  const local=players.find(pl=>pl.uid&&pl.uid===p.uid)||players.find(pl=>pl.id===p.id);
  if(local)awardPlayerPoints(local.id,1,'sarabanda');
  const audio=document.getElementById('sara-audio');
  sarabandaState.resumeAt=audio?.currentTime||sarabandaState.resumeAt||0;
  sarabandaState.revealed=true;
  sarabandaState.fullPlay=true;
  setSarabandaMessage(`Punto a ${p.name}!`);
  renderSarabanda();
  playFullSarabandaTrack(true);
  syncSarabandaState();
}

function wrongSarabandaAnswer(){
  const p=sarabandaState.players.find(pl=>pl.id===sarabandaState.activePid);
  setSarabandaMessage(p?`${p.name} ha sbagliato. Riprova o passa alla prossima canzone.`:'Risposta sbagliata.');
  renderSarabanda();
  syncSarabandaState();
}

function revealSarabandaTrack(){
  const track=getCurrentSarabandaTrack();
  if(!track)return;
  const audio=document.getElementById('sara-audio');
  sarabandaState.resumeAt=audio?.currentTime||sarabandaState.resumeAt||0;
  sarabandaState.revealed=true;
  sarabandaState.fullPlay=true;
  setSarabandaMessage(`${track.title} - ${track.artist}`);
  renderSarabanda();
  playFullSarabandaTrack(true);
  syncSarabandaState();
}

function nextSarabandaTrack(){
  if(sarabandaState.idx+1>=sarabandaState.tracks.length){
    endSarabanda();
    return;
  }
  sarabandaState.idx++;
  const nextPlayer=sarabandaState.players[sarabandaState.idx%sarabandaState.players.length];
  sarabandaState.activePid=nextPlayer?.id||null;
  sarabandaState.revealed=false;
  sarabandaState.fullPlay=false;
  sarabandaState.resumeAt=0;
  sarabandaState.message=`Turno di ${nextPlayer?.name||'Giocatore'}.`;
  renderSarabanda();
  playSarabandaPreview();
  syncSarabandaState();
}

function endSarabanda(){
  stopSarabandaAudio();
  sarabandaState.completed=true;
  syncSarabandaState();
  const winner=[...(sarabandaState.players||[])].sort((a,b)=>(b.score||0)-(a.score||0))[0];
  if(winner){
    document.getElementById('win-name').textContent=winner.name;
    document.getElementById('win-sub').textContent='Ha vinto Sarabanda!';
    document.getElementById('win-scores').innerHTML='<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Classifica Sarabanda</div>'+
      sarabandaState.players.sort((a,b)=>(b.score||0)-(a.score||0)).map((p,i)=>`<div class="sc-row">
        <div class="sc-rank">${i+1}</div>
        <div class="sc-name">${escapeHtml(p.name)}</div>
        <div class="sc-pts">${p.score||0}</div>
      </div>`).join('');
  }
  recordCompletedGame('sarabanda',winner?.uid?[winner.uid]:[]);
  goTo('s-win');
  cleanupOnlineGameArtifacts();
}

/* ══════════════════════════════
   INDOVINA CHI
══════════════════════════════ */
let guessWhoState={};
const GUESS_WHO_ROUNDS=5;

async function beginGuessWho(options={}){
  activeStatsGame='guesswho';
  if(!players.length){goTo('s-setup');return;}
  if(options.sessionId)listenGameSession(options.sessionId);
  const bank=options.characters||await loadQuestionBank('guesswho',GUESS_WHO_CHARACTERS);
  const characters=options.characters?[...bank].slice(0,GUESS_WHO_ROUNDS):shuffleArray([...bank]).slice(0,GUESS_WHO_ROUNDS);
  if(!characters.length){
    alert('Aggiungi almeno un personaggio per Indovina Chi.');
    return;
  }
  const gamePlayers=Array.isArray(options.participantUids)&&options.participantUids.length
    ? options.participantUids.map(uid=>players.find(p=>p.uid===uid)).filter(Boolean)
    : players;
  guessWhoState={
    players:gamePlayers.map(p=>({id:p.id,uid:p.uid||null,name:p.name,color:TC[p.ci%TC.length],score:0})),
    characters,
    idx:0,
    clueIdx:0,
    activePid:gamePlayers[0]?.id||null,
    revealed:false,
    completed:false,
    message:`Turno di ${gamePlayers[0]?.name||'Giocatore'}. Indovina con meno indizi possibile.`
  };
  if(!options.fromInvite&&selectedPlayMode==='online'){
    const sessionId=await createGameSession('guesswho',serializeGuessWhoState());
    if(sessionId)listenGameSession(sessionId);
    sendGameInvites('guesswho',{
      sessionId,
      characters,
      participantUids:guessWhoState.players.map(p=>p.uid).filter(Boolean)
    });
  }
  renderGuessWho();
  goTo('s-guesswho');
  syncGuessWhoState();
}

function serializeGuessWhoState(){
  if(!guessWhoState?.players)return null;
  return {
    players:guessWhoState.players.map(p=>({uid:p.uid||null,name:p.name,color:p.color,score:p.score||0})),
    characters:guessWhoState.characters||[],
    idx:guessWhoState.idx||0,
    clueIdx:guessWhoState.clueIdx||0,
    activeUid:guessWhoState.players.find(p=>p.id===guessWhoState.activePid)?.uid||null,
    activeName:guessWhoState.players.find(p=>p.id===guessWhoState.activePid)?.name||null,
    revealed:!!guessWhoState.revealed,
    completed:!!guessWhoState.completed,
    message:guessWhoState.message||''
  };
}

function syncGuessWhoState(){
  const state=serializeGuessWhoState();
  if(state)updateGameSession(state);
}

function applyRemoteGuessWhoState(state){
  if(!state)return;
  applyingRemoteSessionState=true;
  const mappedPlayers=(state.players||[]).map((rp,i)=>{
    const local=players.find(p=>p.uid&&p.uid===rp.uid);
    return {
      id:local?.id||i+1,
      uid:rp.uid||null,
      name:rp.name||local?.name||'Giocatore',
      color:rp.color||TC[i%TC.length],
      score:rp.score||0
    };
  });
  const active=state.activeUid
    ? mappedPlayers.find(p=>p.uid===state.activeUid)
    : mappedPlayers.find(p=>p.name===state.activeName);
  guessWhoState={
    players:mappedPlayers,
    characters:state.characters||[],
    idx:state.idx||0,
    clueIdx:state.clueIdx||0,
    activePid:active?.id||mappedPlayers[0]?.id||null,
    revealed:!!state.revealed,
    completed:!!state.completed,
    message:state.message||''
  };
  renderGuessWho();
  goTo('s-guesswho');
  applyingRemoteSessionState=false;
}

function getCurrentGuessWhoCharacter(){
  return guessWhoState.characters?.[guessWhoState.idx]||null;
}

function isGuessWhoAnswerCorrect(guess,character){
  const normalized=normalizeSarabandaText(guess);
  if(!normalized)return false;
  const answers=[character.name,...(character.aliases||[])].map(normalizeSarabandaText).filter(Boolean);
  return answers.some(answer=>{
    const tolerance=answer.length>=10?2:1;
    return answer.includes(normalized)||
      normalized.includes(answer)||
      getSarabandaTextDistance(normalized,answer)<=tolerance;
  });
}

function renderGuessWho(){
  const character=getCurrentGuessWhoCharacter();
  if(!character)return;
  const active=guessWhoState.players.find(p=>p.id===guessWhoState.activePid);
  const clues=(character.clues||[]).slice(0,(guessWhoState.clueIdx||0)+1);
  const points=Math.max(1,(character.clues?.length||5)-(guessWhoState.clueIdx||0));
  document.getElementById('gw-counter').textContent=`${guessWhoState.idx+1} / ${guessWhoState.characters.length}`;
  document.getElementById('gw-active').textContent=active?.name||'Giocatore';
  document.getElementById('gw-category').textContent=character.category||'Personaggio famoso';
  document.getElementById('gw-points').textContent=`${points} pt`;
  document.getElementById('gw-answer').value='';
  document.getElementById('gw-name').textContent=guessWhoState.revealed?character.name:'???';
  document.getElementById('gw-clues').innerHTML=clues.map((clue,i)=>`
    <div class="gw-clue">
      <span>${i+1}</span>
      <div>${escapeHtml(clue)}</div>
    </div>
  `).join('');
  document.getElementById('gw-players').innerHTML=guessWhoState.players.map(p=>`
    <div class="gw-player${p.id===guessWhoState.activePid?' active':''}">
      <div class="gw-player-name" style="color:${p.color.hex}">${escapeHtml(p.name)}</div>
      <div class="gw-player-score">${p.score||0}</div>
    </div>
  `).join('');
  setGuessWhoMessage(guessWhoState.message||'');
}

function setGuessWhoMessage(text){
  guessWhoState.message=text;
  const el=document.getElementById('gw-message');
  if(el)el.textContent=text;
}

function submitGuessWhoAnswer(){
  const character=getCurrentGuessWhoCharacter();
  if(!character||guessWhoState.revealed)return;
  const guess=document.getElementById('gw-answer')?.value||'';
  if(isGuessWhoAnswerCorrect(guess,character))awardGuessWhoPoint();
  else nextGuessWhoClue(true);
}

function awardGuessWhoPoint(){
  const character=getCurrentGuessWhoCharacter();
  const p=guessWhoState.players.find(pl=>pl.id===guessWhoState.activePid);
  if(!character||!p)return;
  const points=Math.max(1,(character.clues?.length||5)-(guessWhoState.clueIdx||0));
  p.score=(p.score||0)+points;
  const local=players.find(pl=>pl.uid&&pl.uid===p.uid)||players.find(pl=>pl.id===p.id);
  if(local)awardPlayerPoints(local.id,points,'indovina-chi');
  guessWhoState.revealed=true;
  setGuessWhoMessage(`${p.name} ha indovinato: ${character.name}. +${points} punti!`);
  renderGuessWho();
  syncGuessWhoState();
}

function nextGuessWhoClue(fromWrong=false){
  const character=getCurrentGuessWhoCharacter();
  if(!character||guessWhoState.revealed)return;
  const maxIdx=(character.clues?.length||1)-1;
  if((guessWhoState.clueIdx||0)>=maxIdx){
    setGuessWhoMessage(fromWrong?'Risposta sbagliata. Non ci sono altri indizi.':'Hai gia tutti gli indizi.');
    renderGuessWho();
    syncGuessWhoState();
    return;
  }
  guessWhoState.clueIdx++;
  const prefix=fromWrong?'Risposta sbagliata. ':'';
  setGuessWhoMessage(`${prefix}Indizio ${guessWhoState.clueIdx+1} sbloccato.`);
  renderGuessWho();
  syncGuessWhoState();
}

function revealGuessWhoCharacter(){
  const character=getCurrentGuessWhoCharacter();
  if(!character)return;
  guessWhoState.revealed=true;
  setGuessWhoMessage(`Era ${character.name}. Nessun punto assegnato.`);
  renderGuessWho();
  syncGuessWhoState();
}

function nextGuessWhoCharacter(){
  if(guessWhoState.idx+1>=guessWhoState.characters.length){
    endGuessWho();
    return;
  }
  guessWhoState.idx++;
  guessWhoState.clueIdx=0;
  guessWhoState.revealed=false;
  const nextPlayer=guessWhoState.players[guessWhoState.idx%guessWhoState.players.length];
  guessWhoState.activePid=nextPlayer?.id||null;
  guessWhoState.message=`Turno di ${nextPlayer?.name||'Giocatore'}.`;
  renderGuessWho();
  syncGuessWhoState();
}

function endGuessWho(){
  guessWhoState.completed=true;
  syncGuessWhoState();
  const winner=[...(guessWhoState.players||[])].sort((a,b)=>(b.score||0)-(a.score||0))[0];
  if(winner){
    document.getElementById('win-name').textContent=winner.name;
    document.getElementById('win-sub').textContent='Ha vinto Indovina Chi!';
    document.getElementById('win-scores').innerHTML='<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Classifica Indovina Chi</div>'+
      guessWhoState.players.sort((a,b)=>(b.score||0)-(a.score||0)).map((p,i)=>`<div class="sc-row">
        <div class="sc-rank">${i+1}</div>
        <div class="sc-name">${escapeHtml(p.name)}</div>
        <div class="sc-pts">${p.score||0}</div>
      </div>`).join('');
  }
  recordCompletedGame('guesswho',winner?.uid?[winner.uid]:[]);
  goTo('s-win');
  cleanupOnlineGameArtifacts();
}

/* ══════════════════════════════
   AUA GAME
══════════════════════════════ */
let auaState={};let auaInt=null;
async function beginAUA(){
  activeStatsGame='aua';
  clearAuaAutoStart();
  hideAuaIntroEffects();
  if(!selPid)return;
  const p=players.find(p=>p.id===selPid);
  document.getElementById('aua-pname').textContent=p.name;
  const questions=await loadQuestionBank('aua',AUA_Q);
  const shuffledQuestions = shuffleArray([...questions]).slice(0, 21);
  auaState={qIdx:0,answered:0,total:21,pid:selPid,max:getTimer('aua'),left:getTimer('aua'),paused:false,questions:shuffledQuestions};
  renderAUATrack();renderAUAQ();startAUATimer();goTo('s-aua');
}
function startAUATimer(){
  clearInterval(auaInt);
  updAUATimer();
  auaInt=setInterval(()=>{
    if(auaState.paused)return;
    auaState.left--;updAUATimer();
    if(auaState.left<=0){clearInterval(auaInt);auaTimeUp();}
  },1000);
}
function updAUATimer(){
  const pct=Math.round(auaState.left/auaState.max*100);
  const col=auaState.left<=5?'#E74C3C':auaState.left<=10?'#F5C518':'#2ECC71';
  const b=document.getElementById('aua-tbar');const d=document.getElementById('aua-tdisp');
  if(b){b.style.width=pct+'%';b.style.background=col;}
  if(d){d.textContent=auaState.left;d.style.color=auaState.left<=5?'#E74C3C':auaState.left<=10?'var(--gold)':'var(--txt)';}
}
function auaTimeUp(){
  stopQuestionSpeech();
  auaState.paused=true;
  stopAuaAudio();
  goTo('s-hero');
}
function renderAUATrack(){
  document.getElementById('aua-track').innerHTML=Array.from({length:auaState.total},(_,i)=>
    `<div class="prog-dot${i<auaState.answered?' done':i===auaState.answered?' cur':''}" id="dot-${i}"></div>`).join('');
}
function updAUATrack(){
  for(let i=0;i<auaState.total;i++){
    const d=document.getElementById('dot-'+i);if(!d)continue;
    d.className='prog-dot'+(i<auaState.answered?' done':i===auaState.answered?' cur':'');
  }
}
function renderAUAQ(){
  const q=auaState.questions[auaState.qIdx];
  document.getElementById('aua-content').innerHTML=`<div class="q-card">
    <div class="q-num">Domanda ${auaState.qIdx+1} di ${auaState.total}</div>
    <div class="q-hint">⚠ Dai la risposta SBAGLIATA!</div>
    <div class="q-text">${q.q}</div>
    <div class="answers">${q.a.map((ans,i)=>`<button class="ans-btn" id="ans-${i}" onclick="answerAUA('${ans}',${i})">${ans}</button>`).join('')}</div>
  </div>`;
  speakQuestion(q.q);
}
function answerAUA(chosen,idx){
  stopQuestionSpeech();
  const q=auaState.questions[auaState.qIdx];const win=chosen===q.wrong;
  document.querySelectorAll('.ans-btn').forEach(b=>b.classList.add('disabled'));
  document.getElementById('ans-'+idx)?.classList.add(win?'correct':'wrong');
  auaState.paused=true;
  if(win){
    auaState.answered++;updAUATrack();
    setTimeout(()=>{
      auaState.paused=false;
      if(auaState.answered>=auaState.total){clearInterval(auaInt);awardAndWin(auaState.pid);}
      else{auaState.qIdx++;renderAUAQ();}
    },600);
  } else {
    q.a.forEach((a,i)=>{if(a===q.wrong)document.getElementById('ans-'+i)?.classList.add('correct');});
    setTimeout(()=>showAUAFail(),600);
  }
}
function showAUAFail(){
  stopQuestionSpeech();
  playAuaErrorSound();
  document.getElementById('aua-content').innerHTML=`<div style="text-align:center;background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.4);border-radius:18px;padding:1.5rem">
    <div style="font-size:2rem;margin-bottom:.5rem">💥</div>
    <div style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#E74C3C;letter-spacing:2px">HAI SBAGLIATO!</div>
    <div style="font-size:.85rem;color:var(--mut);margin:.4rem 0 0">Hai detto quella giusta... si ricomincia, ma il tempo continua!</div></div>`;
  auaState.qIdx=0;
  auaState.answered=0;
  auaState.paused=false;
  renderAUATrack();
  setTimeout(()=>{
    if(auaState.left>0&&!auaState.paused)renderAUAQ();
  },900);
}
function restartAUA(){
  auaState.qIdx=0;
  auaState.answered=0;
  auaState.left=auaState.max;
  renderAUATrack();
  renderAUAQ();
  startAUATimer();
}

/* ══════════════════════════════
   EREDITA GAME
══════════════════════════════ */
let ereState={};let ereInt=null;let spaceKH=null;

async function beginEredita(options={}){
  activeStatsGame='eredita';
  if(!selP1||!selP2)return;
  clearInterval(ereInt);
  if(options.sessionId)listenGameSession(options.sessionId);
  if(spaceKH){document.removeEventListener('keydown',spaceKH);spaceKH=null;}

  const p1=players.find(p=>p.id===selP1);
  const p2=players.find(p=>p.id===selP2);
  const t1=teams.find(t=>t.mids.includes(selP1));
  const t2=teams.find(t=>t.mids.includes(selP2));
  if(!p1||!p2)return;

  const words=options.words||await loadQuestionBank('eredita',ERE_WORDS);
  const wordList=options.words?[...words]:[...words].sort(()=>Math.random()-.5);
  if(!wordList.length){
    alert('Non ci sono parole disponibili per avviare L’Eredità.');
    return;
  }
  const revOrders=options.revOrders||wordList.map(w=>w.word.split('').map((l,i)=>({l,i})).filter(x=>x.l!==' ').sort(()=>Math.random()-.5).map(x=>x.i));

  ereState={
    p:[
      {id:selP1,uid:p1.uid||null,name:p1.name,color:t1?t1.color:TC[p1.ci%TC.length],team:t1,score:0},
      {id:selP2,uid:p2.uid||null,name:p2.name,color:t2?t2.color:TC[p2.ci%TC.length],team:t2,score:0},
    ],
    active:0,
    words:wordList,
    revOrders,
    wIdx:0,
    max:getTimer('ere'),
    left:[getTimer('ere'),getTimer('ere')],
    revealed:[],
    revOrder:[],
    totalWords:wordList.length,
    blocked:false,
  };
  if(!options.fromInvite&&selectedPlayMode==='online'){
    const sessionId=await createGameSession('eredita',serializeEreditaState());
    if(sessionId)listenGameSession(sessionId);
    sendGameInvites('eredita',{p1Uid:p1.uid||null,p2Uid:p2.uid||null,words:wordList,revOrders,sessionId});
  }

  spaceKH=function(e){
    if(e.code==='Space'&&document.getElementById('s-eredita').classList.contains('active')){
      e.preventDefault();
      onSpacePress();
    }
  };
  document.addEventListener('keydown',spaceKH);

  goTo('s-eredita');
  loadEreditaWord();
  syncEreditaState();
}

function serializeEreditaState(){
  if(!ereState?.p)return null;
  return {
    p:ereState.p.map(p=>({uid:p.uid||null,name:p.name,color:p.color,score:p.score||0})),
    active:ereState.active||0,
    words:ereState.words||[],
    revOrders:ereState.revOrders||[],
    wIdx:ereState.wIdx||0,
    max:ereState.max,
    left:ereState.left||[],
    revealed:ereState.revealed||[],
    revOrder:ereState.revOrder||[],
    totalWords:ereState.totalWords,
    blocked:!!ereState.blocked
  };
}

function syncEreditaState(){
  const state=serializeEreditaState();
  if(state)updateGameSession(state);
}

function applyRemoteEreditaState(state){
  if(!state)return;
  applyingRemoteSessionState=true;
  clearInterval(ereInt);
  ereState={
    p:(state.p||[]).map((rp,i)=>{
      const local=players.find(p=>p.uid&&p.uid===rp.uid);
      return {
        id:local?.id||i+1,
        uid:rp.uid||null,
        name:rp.name||local?.name||'Giocatore',
        color:rp.color||TC[i%TC.length],
        team:local?teams.find(t=>t.mids.includes(local.id)):null,
        score:rp.score||0
      };
    }),
    active:state.active||0,
    words:state.words||[],
    revOrders:state.revOrders||[],
    wIdx:state.wIdx||0,
    max:state.max||getTimer('ere'),
    left:state.left||[getTimer('ere'),getTimer('ere')],
    revealed:state.revealed||[],
    revOrder:state.revOrder||[],
    totalWords:state.totalWords||state.words?.length||0,
    blocked:!!state.blocked
  };
  goTo('s-eredita');
  renderEreditaPanels();
  renderWordCard(false);
  applyingRemoteSessionState=false;
  if(canControlEreditaOnline()&&!ereState.blocked)startEreditaTimer();
}

function canControlEreditaOnline(){
  if(selectedPlayMode!=='online'||!activeGameSessionId)return true;
  const uid=ereState.p?.[ereState.active]?.uid;
  return !uid||uid===currentUser?.uid;
}

function loadEreditaWord(){
  clearInterval(ereInt);
  const es=ereState;
  if(es.wIdx>=es.words.length){endEredita();return;}

  document.getElementById('ere-word-counter').textContent=`Parola ${es.wIdx+1} / ${es.totalWords}`;

  const word=es.words[es.wIdx].word;
  const letters=word.split('').map((l,i)=>({l,i})).filter(x=>x.l!==' ');
  es.revOrder=es.revOrders?.[es.wIdx]||letters.sort(()=>Math.random()-.5).map(x=>x.i);
  es.revealed=[];
  es.blocked=false;

  renderEreditaPanels();
  renderWordCard();
  startEreditaTimer();
}

function renderEreditaPanels(){
  const es=ereState;
  document.getElementById('ere-panels').innerHTML=es.p.map((p,i)=>{
    const isActive=es.active===i;
    const leftTime=es.left[i];
    const pct=Math.round(leftTime/es.max*100);
    const col=leftTime<=5?'#E74C3C':leftTime<=Math.floor(es.max*.25)?'#F5C518':p.color.hex;
    return `<div class="ere-panel${isActive?' active-turn':''}" id="ere-panel-${i}">
      <div class="ep-name" style="color:${p.color.hex}">${p.name}</div>
      <div class="ep-team-badge" style="background:${p.color.light};color:${p.color.hex}">${p.team?p.team.name:'Libero'}</div>
      <div class="ep-timer" id="ere-t-${i}" style="color:${isActive?p.color.hex:'var(--mut)'}">${leftTime}</div>
      <div class="ep-bar-wrap"><div class="ep-bar" id="ere-bar-${i}" style="width:${pct}%;background:${col}"></div></div>
      <div class="ep-score-label">Punti</div>
      <div class="ep-score-val" style="color:${p.color.hex}">${p.score}</div>
    </div>`;
  }).join('');

  const ap=es.p[es.active];
  const ind=document.getElementById('ere-active-ind');
  if(ind){
    ind.textContent=`Sta indovinando: ${ap.name}`;
    ind.style.background=ap.color.light;
    ind.style.color=ap.color.hex;
  }
}

function renderWordCard(shouldSpeak=true){
  const es=ereState;
  const w=es.words[es.wIdx];
  if(!w){
    document.getElementById('ere-word-card').innerHTML='<div class="word-clue">Nessuna parola disponibile</div>';
    return;
  }
  const letters=w.word.split('');
  const boxes=letters.map((l,i)=>{
    if(l===' ')return `<div class="lbox spc"></div>`;
    const rev=es.revealed.includes(i);
    return `<div class="lbox${rev?' rev':''}" id="lb-${i}">${rev?l:''}</div>`;
  }).join('');
  const totalLetters=letters.filter(l=>l!==' ').length;
  document.getElementById('ere-word-card').innerHTML=`
    <div class="word-clue">${w.clue}</div>
    <div class="letter-row">${boxes}</div>
    <div class="rev-count" id="ere-rev-count">${es.revealed.length} / ${totalLetters} lettere rivelate</div>`;
  if(shouldSpeak)speakQuestion(w.clue);
}

function startEreditaTimer(){
  clearInterval(ereInt);
  if(!canControlEreditaOnline())return;
  const es=ereState;
  const totalLetters=es.revOrder.length;

  ereInt=setInterval(()=>{
    if(es.blocked)return;
    const ai=es.active;
    es.left[ai]--;

    const pct=Math.round(es.left[ai]/es.max*100);
    const col=es.left[ai]<=5?'#E74C3C':es.left[ai]<=Math.floor(es.max*.25)?'#F5C518':es.p[ai].color.hex;
    const te=document.getElementById(`ere-t-${ai}`);
    const be=document.getElementById(`ere-bar-${ai}`);
    if(te)te.textContent=es.left[ai];
    if(be){be.style.width=pct+'%';be.style.background=col;}

    // update inactive panel timer display too
    const other = 1-ai;
    const otherTe=document.getElementById(`ere-t-${other}`);
    const otherBe=document.getElementById(`ere-bar-${other}`);
    if(otherTe) otherTe.textContent=es.left[other];
    if(otherBe){
      const otherPct=Math.round(es.left[other]/es.max*100);
      const otherCol=es.left[other]<=5?'#E74C3C':es.left[other]<=Math.floor(es.max*.25)?'#F5C518':es.p[other].color.hex;
      otherBe.style.width=otherPct+'%';
      otherBe.style.background=otherCol;
    }

    // reveal letters evenly across the timer
    if(totalLetters>0){
      const shouldReveal=Math.floor((es.max-es.left[ai])/es.max*totalLetters);
      while(es.revealed.length<shouldReveal&&es.revealed.length<totalLetters){
        const nextIdx=es.revOrder[es.revealed.length];
        es.revealed.push(nextIdx);
        const lb=document.getElementById('lb-'+nextIdx);
        if(lb){lb.classList.add('rev');lb.textContent=es.words[es.wIdx].word[nextIdx];}
      }
      const rc=document.getElementById('ere-rev-count');
      if(rc)rc.textContent=`${es.revealed.length} / ${totalLetters} lettere rivelate`;
    }
    syncEreditaState();

    if(es.left[ai]<=0){
      clearInterval(ereInt);
      handleEreditaTimeout();
    }
  },1000);
}

function onSpacePress(){
  const es=ereState;
  if(!canControlEreditaOnline())return;
  if(es.blocked)return;
  stopQuestionSpeech();
  // current active player guessed correctly
  clearInterval(ereInt);
  es.blocked=true;

  const winner=es.p[es.active];
  winner.score++;
  awardPlayerPoints(winner.id,1,'eredita');

  // reveal full word
  const w=es.words[es.wIdx];
  w.word.split('').forEach((l,i)=>{
    if(l===' ')return;
    const lb=document.getElementById('lb-'+i);
    if(lb){lb.classList.add('rev');lb.textContent=l;}
  });

  // flash panel
  const panel=document.getElementById(`ere-panel-${es.active}`);
  if(panel)panel.classList.add('just-scored');

  // update score display
  const scoreEl=document.querySelector(`#ere-panel-${es.active} .ep-score-val`);
  if(scoreEl)scoreEl.textContent=winner.score;

  const ind=document.getElementById('ere-active-ind');
  if(ind){
    ind.textContent=`✓ Punto a ${winner.name}!`;
    ind.style.background='rgba(46,204,113,.15)';
    ind.style.color='#2ECC71';
  }

  // alternate starting player for next word
  es.active = 1 - es.active;
  syncEreditaState();

  setTimeout(()=>{
    if(ereState.wIdx+1>=ereState.words.length){
      endEredita();
    } else {
      nextEreditaWord();
    }
  },1200);
}

function handleEreditaTimeout(){
  stopQuestionSpeech();
  const es=ereState;
  if(!canControlEreditaOnline())return;
  const loserIdx=es.active;
  const winnerIdx=1-loserIdx;
  const winner=es.p[winnerIdx];
  winner.score++;
  awardPlayerPoints(winner.id,1,'eredita');

  // reveal full word
  const w=es.words[es.wIdx];
  w.word.split('').forEach((l,i)=>{
    if(l===' ')return;
    const lb=document.getElementById('lb-'+i);
    if(lb){lb.classList.add('rev');lb.textContent=l;}
  });

  const panel=document.getElementById(`ere-panel-${winnerIdx}`);
  if(panel)panel.classList.add('just-scored');
  const scoreEl=document.querySelector(`#ere-panel-${winnerIdx} .ep-score-val`);
  if(scoreEl)scoreEl.textContent=winner.score;

  const ind=document.getElementById('ere-active-ind');
  if(ind){
    ind.textContent=`⏱ Punto a ${winner.name}!`;
    ind.style.background='rgba(46,204,113,.15)';
    ind.style.color='#2ECC71';
  }

  es.blocked=true;
  clearInterval(ereInt);
  syncEreditaState();
  endEredita();
}

function nextEreditaWord(){
  const es=ereState;
  es.wIdx++;
  document.getElementById('ere-controls').innerHTML='';
  loadEreditaWord();
  syncEreditaState();
}

function endEredita(){
  clearInterval(ereInt);
  if(spaceKH){document.removeEventListener('keydown',spaceKH);spaceKH=null;}
  const es=ereState;
  const winner=es.p[0].score>=es.p[1].score?es.p[0]:es.p[1];
  awardAndWin(winner.id);
  cleanupOnlineGameArtifacts();
}

/* ══════════════════════════════
   RUOTA GAME
══════════════════════════════ */
let wheelState={};let wheelRotation=0;
const WHEEL_VOWELS=['A','E','I','O','U'];

function selPickWheel(id){
  selWheelPid=id;
  document.querySelectorAll('#pick-grid-wheel .player-pick').forEach(e=>e.classList.remove('selected'));
  document.getElementById('pp-wheel-'+id)?.classList.add('selected');
  const btn=document.getElementById('btn-pick-wheel-go');
  if(btn)btn.disabled=false;
}

async function beginWheel(options={}){
  activeStatsGame='ruota';
  if(!selWheelPid)return;
  hideWheelIntroEffects();
  if(options.sessionId)listenGameSession(options.sessionId);
  const wheelPlayersSource=Array.isArray(options.participantUids)&&options.participantUids.length
    ? options.participantUids.map(uid=>players.find(p=>p.uid===uid)).filter(Boolean)
    : players;
  const startIdx=wheelPlayersSource.findIndex(p=>p.id===selWheelPid);
  if(startIdx<0)return;
  const phrases=await loadQuestionBank('ruota',WHEEL_PHRASES);
  const phrase=options.phrase&&options.category
    ? {text:options.phrase,cat:options.category}
    : phrases[Math.floor(Math.random()*phrases.length)];
  wheelState={
    players:wheelPlayersSource.map(p=>{
      const t=teams.find(t=>t.mids.includes(p.id));
      return {id:p.id,uid:p.uid||null,name:p.name,color:TC[p.ci%TC.length],team:t,bank:0};
    }),
    active:startIdx,
    phrase:phrase.text,
    category:phrase.cat,
    revealed:new Set(),
    spinning:false,
    lastPrize:null,
    pendingPrize:null,
    completed:false
  };
  wheelRotation=0;
  document.getElementById('wheel-pname').textContent=getActiveWheelPlayer().name;
  const disc=document.getElementById('wheel-disc');
  if(disc){
    disc.style.transition='none';
    disc.style.transform='rotate(0deg)';
    requestAnimationFrame(()=>{disc.style.transition='transform 4s cubic-bezier(.12,.78,.18,1)';});
  }
  renderWheelLabels();
  renderWheelGame();
  setWheelMessage('Gira la ruota per scoprire una lettera.');
  renderWheelLetterPanel();
  document.getElementById('wheel-solution-input').value='';
  goTo('s-wheel');
  showWheelTurnNotice();
  if(!options.fromInvite){
    const starter=players.find(p=>p.id===selWheelPid);
    const participants=getOnlineParticipants();
    let sessionId=null;
    if(selectedPlayMode==='online'){
      sessionId=await createGameSession('ruota',serializeWheelState());
      if(sessionId)listenGameSession(sessionId);
    }
    sendGameInvites('ruota',{
      starterUid:starter?.uid||null,
      participantUids:participants.map(p=>p.uid),
      sessionId,
      phrase:phrase.text,
      category:phrase.cat
    });
  }
}

function isWheelLetter(ch){
  return /^[A-Z]$/.test(ch);
}
function isWheelVowel(ch){
  return WHEEL_VOWELS.includes(ch);
}

function renderWheelLabels(){
  const el=document.getElementById('wheel-labels');
  if(!el)return;
  el.innerHTML=WHEEL_SEGMENTS.map((s,i)=>{
    const angle=i*30+15;
    return `<div class="wheel-label" style="--a:${angle}deg">${s.label}</div>`;
  }).join('');
}

function renderWheelGame(){
  const ws=wheelState;
  const active=getActiveWheelPlayer();
  if(active)document.getElementById('wheel-pname').textContent=active.name;
  document.getElementById('wheel-category').textContent=ws.category;
  document.getElementById('wheel-round-score').textContent=active?active.bank:0;
  document.getElementById('wheel-prize').textContent=ws.lastPrize?ws.lastPrize.label:'—';
  const hiddenLetters=[...ws.phrase].filter(ch=>isWheelLetter(ch)&&!ws.revealed.has(ch)).length;
  document.getElementById('wheel-left-count').textContent=hiddenLetters;
  document.getElementById('wheel-phrase').innerHTML=ws.phrase.split(' ').map(word=>{
    const tiles=[...word].map(ch=>{
      if(!isWheelLetter(ch))return `<div class="phrase-tile punct">${ch}</div>`;
      const shown=ws.revealed.has(ch);
      return `<div class="phrase-tile${shown?' revealed':''}">${shown?ch:''}</div>`;
    }).join('');
    return `<div class="phrase-word">${tiles}</div>`;
  }).join('');
  renderWheelBanks();
  renderWheelLetterPanel();
}

function getActiveWheelPlayer(){
  return wheelState.players?.[wheelState.active]||null;
}

function renderWheelBanks(){
  const el=document.getElementById('wheel-banks');
  if(!el||!wheelState.players)return;
  el.innerHTML=wheelState.players.map((p,i)=>`
    <div class="wheel-bank${i===wheelState.active?' active':''}">
      <div class="wheel-bank-name" style="color:${p.color.hex}">${p.name}</div>
      <div class="wheel-bank-score">${p.bank}</div>
    </div>
  `).join('');
}

function renderWheelLetterPanel(){
  const ws=wheelState;
  const panel=document.getElementById('wheel-letter-panel');
  const input=document.getElementById('wheel-letter-input');
  const label=document.getElementById('wheel-letter-label');
  const vowels=document.getElementById('wheel-vowels');
  if(!panel||!input||!label||!vowels)return;
  const canGuess=!!(ws.pendingPrize&&!ws.spinning&&!ws.completed);
  const active=getActiveWheelPlayer();
  const canBuy=active&&active.bank>400&&getHiddenWheelLetters().some(isWheelVowel)&&!ws.spinning&&!ws.completed;
  panel.classList.toggle('active',canGuess||canBuy);
  input.disabled=!canGuess;
  document.getElementById('wheel-letter-submit').disabled=!canGuess;
  label.textContent=canGuess?`Scegli una consonante per ${ws.pendingPrize.label} punti`:'Compra una vocale per 400 punti';
  if(canGuess){
    input.value='';
    setTimeout(()=>input.focus(),0);
  }
  vowels.innerHTML=WHEEL_VOWELS.map(v=>{
    const hidden=ws.phrase.includes(v)&&!ws.revealed.has(v);
    const disabled=!canBuy||!hidden;
    return `<button class="btn-ghost" ${disabled?'disabled':''} onclick="buyWheelVowel('${v}')">${v}</button>`;
  }).join('');
}

function setWheelMessage(text){
  if(wheelState)wheelState.message=text;
  const el=document.getElementById('wheel-message');
  if(el)el.textContent=text;
}

function serializeWheelState(){
  if(!wheelState?.players)return null;
  return {
    players:wheelState.players.map(p=>({
      uid:p.uid||null,
      name:p.name,
      color:p.color,
      bank:p.bank||0
    })),
    active:wheelState.active||0,
    phrase:wheelState.phrase,
    category:wheelState.category,
    revealed:[...(wheelState.revealed||new Set())],
    spinning:!!wheelState.spinning,
    lastPrize:wheelState.lastPrize||null,
    pendingPrize:wheelState.pendingPrize||null,
    completed:!!wheelState.completed,
    message:wheelState.message||''
  };
}

function syncWheelState(){
  const state=serializeWheelState();
  if(state)updateGameSession(state);
}

function canControlWheelOnline(){
  if(selectedPlayMode!=='online'||!activeGameSessionId)return true;
  const uid=getActiveWheelPlayer()?.uid;
  return !uid||uid===currentUser?.uid;
}

function applyRemoteWheelState(state){
  if(!state||!document.getElementById('s-wheel'))return;
  applyingRemoteWheelState=true;
  wheelState={
    players:(state.players||[]).map((rp,i)=>{
      const local=players.find(p=>p.uid&&p.uid===rp.uid);
      const color=rp.color||TC[i%TC.length];
      return {
        id:local?.id||i+1,
        uid:rp.uid||local?.uid||null,
        name:rp.name||local?.name||'Giocatore',
        color,
        team:local?teams.find(t=>t.mids.includes(local.id)):null,
        bank:rp.bank||0
      };
    }),
    active:state.active||0,
    phrase:state.phrase||'',
    category:state.category||'',
    revealed:new Set(state.revealed||[]),
    spinning:!!state.spinning,
    lastPrize:state.lastPrize||null,
    pendingPrize:state.pendingPrize||null,
    completed:!!state.completed,
    message:state.message||''
  };
  goTo('s-wheel');
  renderWheelLabels();
  renderWheelGame();
  setWheelMessage(wheelState.message||'Partita online aggiornata.');
  applyingRemoteWheelState=false;
}

function showWheelTurnNotice(){
  const active=getActiveWheelPlayer();
  const alert=document.getElementById('wheel-turn-alert');
  const name=document.getElementById('wheel-turn-name');
  if(!active||!alert||!name)return;
  name.textContent=active.name;
  alert.classList.add('active');
  setTimeout(()=>alert.classList.remove('active'),1200);
}

function passWheelTurn(reason){
  const ws=wheelState;
  if(!ws.players?.length||ws.completed)return;
  ws.pendingPrize=null;
  ws.lastPrize=null;
  ws.active=(ws.active+1)%ws.players.length;
  const active=getActiveWheelPlayer();
  renderWheelGame();
  setWheelMessage(`${reason} Tocca a ${active.name}.`);
  showWheelTurnNotice();
  syncWheelState();
}

function normalizeWheelSolution(text){
  return (text||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^A-Z0-9]/gi,'')
    .toUpperCase();
}

function getHiddenWheelLetters(){
  return [...new Set([...wheelState.phrase].filter(ch=>isWheelLetter(ch)&&!wheelState.revealed.has(ch)))];
}
function getHiddenWheelConsonants(){
  return getHiddenWheelLetters().filter(ch=>!isWheelVowel(ch));
}

function spinWheel(){
  const ws=wheelState;
  if(!canControlWheelOnline())return;
  if(ws.spinning||ws.pendingPrize)return;
  const hidden=getHiddenWheelLetters();
  const hiddenConsonants=getHiddenWheelConsonants();
  if(!hidden.length){completeWheelPhrase();return;}
  if(!hiddenConsonants.length){
    const active=getActiveWheelPlayer();
    setWheelMessage(active&&active.bank>400?'Restano solo vocali: comprane una o risolvi.':'Restano solo vocali: puoi risolvere la frase.');
    renderWheelLetterPanel();
    return;
  }
  ws.spinning=true;
  ws.pendingPrize=null;
  renderWheelLetterPanel();
  setWheelMessage('La ruota gira...');
  syncWheelState();

  const idx=Math.floor(Math.random()*WHEEL_SEGMENTS.length);
  const prize=WHEEL_SEGMENTS[idx];
  const segmentSize=360/WHEEL_SEGMENTS.length;
  const center=idx*segmentSize+(segmentSize/2);
  const jitter=(Math.random()-.5)*(segmentSize*.55);
  const target=360-(center+jitter);
  wheelRotation+=360*5+target-(wheelRotation%360);
  const disc=document.getElementById('wheel-disc');
  if(disc)disc.style.transform=`rotate(${wheelRotation}deg)`;

  setTimeout(()=>{
    ws.lastPrize=prize;
    if(prize.bankrupt){
      const active=getActiveWheelPlayer();
      if(active)active.bank=0;
      ws.pendingPrize=null;
      passWheelTurn('Bancarotta!');
    } else if(prize.pass){
      ws.pendingPrize=null;
      passWheelTurn('Passa turno.');
    } else {
      ws.pendingPrize=prize;
      setWheelMessage(`Premio ${prize.label}: scegli una consonante.`);
    }
    ws.spinning=false;
    renderWheelGame();
    syncWheelState();
  },4200);
}

function submitWheelLetter(){
  const ws=wheelState;
  if(!canControlWheelOnline())return;
  const prize=ws.pendingPrize;
  if(!prize||ws.spinning)return;
  const input=document.getElementById('wheel-letter-input');
  const letter=(input?.value||'').trim().toUpperCase();
  if(!isWheelLetter(letter)){
    setWheelMessage('Inserisci una lettera valida.');
    return;
  }
  if(isWheelVowel(letter)){
    setWheelMessage('Dopo il giro puoi scegliere solo consonanti. Le vocali si comprano.');
    return;
  }
  if(ws.revealed.has(letter)){
    setWheelMessage(`${letter} è già stata scoperta. Scegli un'altra consonante.`);
    return;
  }
  const count=[...ws.phrase].filter(ch=>ch===letter).length;
  ws.pendingPrize=null;
  if(count>0){
    const active=getActiveWheelPlayer();
    ws.revealed.add(letter);
    if(active)active.bank+=prize.points*count;
    setWheelMessage(`${letter}: ${count} ${count===1?'lettera':'lettere'}! +${prize.points} x ${count} = +${prize.points*count} punti.`);
  } else {
    passWheelTurn(`${letter} non c'è nella frase.`);
  }
  renderWheelGame();
  syncWheelState();
  if(!getHiddenWheelLetters().length){
    setTimeout(()=>completeWheelPhrase(),700);
  }
}

function buyWheelVowel(vowel){
  const ws=wheelState;
  if(!canControlWheelOnline())return;
  const active=getActiveWheelPlayer();
  if(ws.spinning||ws.pendingPrize||!active||active.bank<=400||ws.completed)return;
  if(ws.revealed.has(vowel))return;
  const count=[...ws.phrase].filter(ch=>ch===vowel).length;
  if(!count)return;
  active.bank-=400;
  ws.revealed.add(vowel);
  setWheelMessage(`Hai comprato la vocale ${vowel}: ${count} ${count===1?'presenza':'presenze'}. -400 punti.`);
  renderWheelGame();
  syncWheelState();
  if(!getHiddenWheelLetters().length){
    setTimeout(()=>completeWheelPhrase(),700);
  }
}

function submitWheelSolution(){
  const ws=wheelState;
  if(!canControlWheelOnline())return;
  if(!ws.phrase||ws.spinning||ws.completed)return;
  const input=document.getElementById('wheel-solution-input');
  const guess=input?.value||'';
  if(!guess.trim()){
    setWheelMessage('Scrivi una soluzione prima di provare.');
    return;
  }
  if(normalizeWheelSolution(guess)!==normalizeWheelSolution(ws.phrase)){
    if(input){
      input.value='';
    }
    passWheelTurn('Soluzione sbagliata.');
    return;
  }
  solveWheelPhrase();
}

function solveWheelPhrase(){
  if(!wheelState.phrase||wheelState.spinning)return;
  wheelState.pendingPrize=null;
  [...wheelState.phrase].forEach(ch=>{if(isWheelLetter(ch))wheelState.revealed.add(ch);});
  renderWheelGame();
  syncWheelState();
  completeWheelPhrase();
}

document.addEventListener('keydown',e=>{
  if(e.code!=='Space')return;
  if(!document.getElementById('s-wheel')?.classList.contains('active'))return;
  const tag=(e.target?.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||tag==='select'||e.target?.isContentEditable)return;
  e.preventDefault();
  spinWheel();
});

function completeWheelPhrase(){
  const ws=wheelState;
  if(ws.completed)return;
  ws.completed=true;
  const active=getActiveWheelPlayer();
  if(!active)return;
  const bonus=Math.max(1,active?active.bank:0);
  setWheelMessage(`Frase completata! +${bonus} punti in classifica.`);
  syncWheelState();
  renderHomeLeaderboard();
  setTimeout(()=>awardAndWin(active.id,bonus,`+${bonus} punti con la ruota!`),900);
}

/* ── WIN ── */
function awardAndWin(pid,points=1,subText=null){
  const p=players.find(p=>p.id===pid);
  const t=teams.find(t=>t.mids.includes(pid));
  awardPlayerPoints(pid,points,'manche');
  recordCompletedGame(activeStatsGame,p?.uid?[p.uid]:[]);
  document.getElementById('win-name').textContent=p?p.name:'—';
  document.getElementById('win-sub').textContent=subText||(t?`+1 punto per ${t.name}!`:'Ha vinto questa manche!');
  const sorted=[...players].sort((a,b)=>b.score-a.score);
  const medals=['🥇','🥈','🥉'];
  let html='<div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin-bottom:.6rem">Classifica giocatori</div>';
  html+=sorted.map((pl,i)=>{
    const c=TC[pl.ci%TC.length];const tm=teams.find(t=>t.mids.includes(pl.id));
    return `<div class="sc-row">
      <div class="sc-rank">${medals[i]||i+1}</div>
      <div class="avatar" style="background:${c.light};color:${c.hex};width:24px;height:24px;font-size:.62rem;border-radius:50%;flex-shrink:0">${initials(pl.name)}</div>
      <div class="sc-name">${pl.name}${tm?` <span style="font-size:.68rem;color:var(--mut)">(${tm.name})</span>`:''}</div>
      <div class="sc-pts">${pl.score}</div></div>`;
  }).join('');
  if(teams.length){
    html+='<div style="height:.5rem"></div><div style="font-size:.68rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--mut);margin:.4rem 0">Squadre</div>';
    html+=[...teams].sort((a,b)=>b.score-a.score).map((tm,i)=>`<div class="sc-row">
      <div class="sc-rank">${medals[i]||i+1}</div>
      <div style="width:10px;height:10px;border-radius:50%;background:${tm.color.hex};flex-shrink:0"></div>
      <div class="sc-name">${tm.name}</div><div class="sc-pts">${tm.score}</div></div>`).join('');
  }
  document.getElementById('win-scores').innerHTML=html;
  renderHomeLeaderboard();
  stopAuaAudio();
  goTo('s-win');
  cleanupOnlineGameArtifacts();
}

// LOGIN
const firebaseConfig = {
        apiKey: "AIzaSyAs9kwrZnnBTOaBzkLn6ZhLN5mfWWmXcl4",
        authDomain: "tv-game-night.firebaseapp.com",
        databaseURL: "https://tv-game-night-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "tv-game-night",
        storageBucket: "tv-game-night.firebasestorage.app",
        messagingSenderId: "570468387403",
        appId: "1:570468387403:web:1bcd29c85f8e8d00539bce",
        measurementId: "G-6LYXHB8VCJ"
    };

const firebaseApp = firebase.apps?.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
let analytics = null;
try{
  analytics = typeof firebase.analytics === 'function' ? firebase.analytics(firebaseApp) : null;
}catch(err){
  console.warn('Analytics non inizializzato:',err);
}

const auth = firebase.auth();
const database = firebase.database();
const db = firebase.firestore();
window.db = db;
window.seedQuestionBanksToFirestore = seedQuestionBanksToFirestore;
let currentUser = null;
listenTabooScoreEvents();

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("authOverlay");
  initAppRouting();
  window.addEventListener('beforeunload',stopSarabandaAudio);
  window.addEventListener('beforeunload',()=>{
    if(presenceRef){
      presenceRef.update({
        online:false,
        currentGame:'offline',
        updatedAt:firebase.database.ServerValue.TIMESTAMP
      }).catch(()=>{});
    }
  });
  renderRegisteredUserSelect();
  auth.onAuthStateChanged(user => {
    console.log("USER:", user);
    currentUser = user;

    if(user){
      if(overlay){
        overlay.style.display = "none"; // forza nascondimento
      }
      updateUserUI(user);
      if(user.isAnonymous){
        showOnboardingTutorial();
        startAnonymousLifecycle();
      }else{
        stopAnonymousLifecycle();
      }
      saveUserIfNew(user).then(isNewUser=>{
        if(isNewUser||isFreshFirebaseAuthUser(user))showOnboardingTutorial();
      });
      addCurrentUserAsPlayer(user);
      loadLeaderboard();
      loadRegisteredUsers();
      listenCurrentUserProfile(user);
      listenGameInvites(user);
      setupPresence(user);
    } else {
      teardownPresence();
      stopAnonymousLifecycle();
      if(unsubscribeLeaderboard)unsubscribeLeaderboard();
      if(unsubscribeRegisteredUsers)unsubscribeRegisteredUsers();
      if(unsubscribeCurrentUserProfile)unsubscribeCurrentUserProfile();
      if(unsubscribeCurrentUserLeaderboard)unsubscribeCurrentUserLeaderboard();
      if(unsubscribeGameInvites)unsubscribeGameInvites();
      stopGameSessionListener();
      globalLeaderboard=[];
      registeredUsers=[];
      currentUserProfile=null;
      currentUserLeaderboard=null;
      pendingGameInvite=null;
      renderRegisteredUserSelect();
      renderHomeLeaderboard();
      closeProfilePopup();
      closeGameInvitePopup();
      onboardingStarted=false;
      const tutorialOverlay=document.getElementById('tutorialOverlay');
      if(tutorialOverlay){
        tutorialOverlay.classList.add('hidden');
        tutorialOverlay.style.display='none';
      }
      if(overlay){
        overlay.style.display = "flex";
      }
    }
  });
});

function loginWithGoogle(){
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

function loginAnonymously(){
  auth.signInAnonymously();
}

function updateUserUI(user){
  const box = document.getElementById("userBox");
  const name = document.getElementById("userName");

  if(box && name){
    if(!user){
      box.classList.add("hidden");
      return;
    }
    box.classList.remove("hidden");
    name.innerText = getProfileDisplayName(currentUserProfile||{},user);
  }
}

function logout(){
  stopSarabandaAudio();
  teardownPresence();
  if(currentUser?.isAnonymous){
    cleanupAnonymousAccount('logout');
    return;
  }
  auth.signOut();
}
