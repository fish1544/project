// build-test.mjs — 从 index.html 注入自动化测试脚本，生成待测 HTML 文件（跨平台）
// 用法: node build-test.mjs <index.html路径> <输出html路径> <deep|tiny>
import { readFileSync, writeFileSync } from 'node:fs';

const DEEP_SCRIPT = `
<script>
window.addEventListener('load', function(){
  setTimeout(function(){
    var diag = [];
    function dlog(k,v){ diag.push(k+'='+JSON.stringify(v)); }
    try {
      try{ localStorage.removeItem('mini-mart-save-v1'); }catch(e){}
      G.day=1; G.hour=6; G.minute=0; G.cash=2000; G.todayIncome=0; G.totalIncome=0; G.todayServed=0;
      G.products=JSON.parse(JSON.stringify(PRODUCTS));
      G.reputation=3; G.storeLevel=1; SHELVES=buildShelves(1); G.loan=0; G.xp=0; G.level=1;
      G.stat={restockSpend:0, staffSpend:0, maxDayIncome:0, totalRestock:0, loansTaken:0};
      G.running=true; G.summaryMode=false; G.paused=false; G.speed=4;
      rollDailyTargets();
      var frames=0, ended=0, evChosen=0;
      while(frames<7000 && ended<2){
        frames++;
        if(G.paused){
          if(!$('event-modal').classList.contains('hidden')){ chooseEvent('a'); evChosen++; }
          else { G.paused=false; }
          continue;
        }
        if(G.summaryMode){
          ended++;
          if(ended===1){ dlog('day1', JSON.stringify({income:Math.round(G.lastDaySummary.income), served:G.lastDaySummary.served, rent:G.lastDaySummary.rent, spoilage:+G.lastDaySummary.spoilage.toFixed(1), rep:+G.lastDaySummary.rep.toFixed(2)})); }
          if(ended===2){ dlog('day2loanPay', G.lastDaySummary.loan); }
          continueNextDay();
          continue;
        }
        if(!G.running) break;
        G.gameTime+=16; updateTime(16); spawnCustomer(16);
        G.customers.forEach(function(c){ c.update(16); });
        G.customers=G.customers.filter(function(c){ return !c.isGone(); });
      }
      dlog('loop', JSON.stringify({days:G.day, cash:Math.round(G.cash), totalInc:Math.round(G.totalIncome), rep:+G.reputation.toFixed(2), xp:G.xp}));
      G.loan=500; G.loanTotal=650;
      G.hour=23; G.minute=55;
      for(var i=0;i<40 && !G.summaryMode;i++){ G.gameTime+=16; updateTime(16); }
      dlog('loanAutoPay', JSON.stringify({loan:G.loan, summaryLoan:G.lastDaySummary?G.lastDaySummary.loan:null}));
      if(G.summaryMode) continueNextDay();
      G.paused=false;
      showEventCard(EVENTS[0]);
      dlog('evPaused', G.paused===true);
      dlog('evVisible', !$('event-modal').classList.contains('hidden'));
      chooseEvent('a');
      dlog('evCostBoost', G.costBoost);
      dlog('evPausedAfter', G.paused===false);
      showEventCard(EVENTS[1]);
      chooseEvent('b');
      dlog('evB', 'no-crash');
      var w=getProduct('water'); w.price=w.cost*4; var oldStock=w.stock;
      var c=new Customer(); c.targetProduct='water'; c.targetShelf=SHELVES.find(function(s){return s.products.indexOf('water')>-1;})||SHELVES[0];
      c.state='browse'; c.shoppingTimer=0; c.happiness=1; c.x=c.targetShelf.x+c.targetShelf.w/2; c.y=c.targetShelf.y+40;
      c.update(16);
      dlog('priceReject', JSON.stringify({bought:c.bought, mood:c.mood, stockSame:w.stock===oldStock}));
      var cc=new Customer();
      dlog('customerType', JSON.stringify({type:cc.ct.name, budget:cc.budget, speed:+cc.speed.toFixed(2)}));
      var before=SHELVES.length;
      G.cash=20000; expandStore();
      dlog('expand1', before+'->'+SHELVES.length+' Lv'+G.storeLevel);
      expandStore(); expandStore(); expandStore();
      dlog('expandMax', 'Lv'+G.storeLevel+' shelves='+SHELVES.length);
      buyUpgrade('fridge'); dlog('icecreamUnlocked', !getProduct('icecream').locked);
      buyUpgrade('microwave'); dlog('odenUnlocked', !getProduct('oden').locked);
      openSettings(); dlog('settingsVisible', !$('settings-modal').classList.contains('hidden'));
      $('settings-modal').classList.add('hidden'); G.paused=false;
      saveGame();
      var raw=localStorage.getItem('mini-mart-save-v1');
      dlog('saveOk', !!(raw && raw.indexOf('storeLevel')>-1));
      loadSave();
      dlog('loadOk', G.storeLevel+'/'+SHELVES.length+' stat='+(G.stat?1:0)+' ver='+(JSON.parse(raw).ver||0));
      var old={day:5, cash:999, reputation:3.4, products:JSON.parse(JSON.stringify(PRODUCTS)), staff:JSON.parse(JSON.stringify(STAFF_TYPES)), upgrades:JSON.parse(JSON.stringify(UPGRADES)), achievements:JSON.parse(JSON.stringify(ACHIEVEMENTS)), totalCustomers:10, servedCustomers:8, weather:'rain'};
      localStorage.setItem('mini-mart-save-v1', JSON.stringify(old));
      G.storeLevel=3; SHELVES=buildShelves(3);
      loadSave();
      dlog('oldSaveCompat', JSON.stringify({day:G.day, cash:G.cash, rep:G.reputation, lvl:G.storeLevel, shelves:SHELVES.length, stat:(G.stat?1:0), settings:(G.settings?1:0)}));
      try { draw(); dlog('drawOk', true); } catch(err){ dlog('drawErr', err.message); }
      document.body.innerHTML = '<div style="font-family:Consolas,monospace;font-size:13px;background:#fff;color:#222;padding:16px;white-space:pre-wrap">TEST PASS<br>' + diag.join('<br>') + '</div>';
    } catch(e){
      document.body.innerHTML = '<div style="font-family:Consolas,monospace;font-size:13px;background:#fff;color:#c00;padding:16px;white-space:pre-wrap">TEST ERROR: ' + (e&&e.message?e.message:e) + '<br>' + ((e&&e.stack||'').slice(0,800)) + '</div>';
    }
  }, 600);
});
</script>
`;

const TINY_SCRIPT = `
<script>
window.addEventListener('load', function(){ setTimeout(function(){
  var out=[];
  try{
    G.cash=1000;
    G.dailyTargets=[{id:'x',text:'test',type:'income',goal:50,reward:10,cur:0,done:false}];
    updateTarget('income',60);
    out.push('targetDone='+G.dailyTargets[0].done+' cash='+G.cash);
    G.dailyTargets=[{id:'y',text:'test2',type:'served',goal:3,reward:20,cur:0,done:false}];
    updateTarget('served',1); updateTarget('served',2);
    out.push('target2Done='+G.dailyTargets[0].done+' cash='+G.cash);
    G.xp=95; G.level=1;
    giveXp(10);
    out.push('levelUp='+G.level+' xp='+G.xp+' bonus='+G.maxStockBonus);
    var p=getProduct('water');
    out.push('fair='+priceFairness(p).toFixed(2));
    out.push('maxStock='+getMaxStock(p));
    G.storeLevel=4;
    out.push('maxStockL4='+getMaxStock(p));
  }catch(e){ out.push('ERR '+e.message); }
  document.body.innerHTML='<div style="font-family:Consolas,monospace;font-size:14px;padding:16px;white-space:pre-wrap">TINY TEST<br>'+out.join('<br>')+'</div>';
},400);});
</script>
`;

function build(indexPath, outPath, kind) {
  const src = readFileSync(indexPath, 'utf8');
  const script = kind === 'tiny' ? TINY_SCRIPT : DEEP_SCRIPT;
  const out = src.replace('</body>', script + '</body>');
  writeFileSync(outPath, out, 'utf8');
  return out.length;
}

const [, , indexArg, outArg, kindArg] = process.argv;
if (indexArg) {
  const n = build(indexArg, outArg, kindArg || 'deep');
  console.log(`built ${outArg} (${n} bytes, ${kindArg || 'deep'})`);
}
export { build, DEEP_SCRIPT, TINY_SCRIPT };
