/* =====================================================================
   plannerData.js — synthetic but production-shaped dataset for the
   Supercharger Quest Planner redesign. Mirrors src/domain/types.ts.
   Deterministic (seeded) so the map + numbers are stable across reloads.
   ===================================================================== */

export const START = { lat: 35.0795, lon: -85.3083 }; // Chattanooga, TN 37405

/* ---- geography ---------------------------------------------------- */
const NAME_TO_CODE = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',
  Connecticut:'CT',Delaware:'DE','District of Columbia':'DC',Florida:'FL',Georgia:'GA',
  Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',
  Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',
  Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH',
  'New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',
  Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',
  Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY',
};
export const CODE_TO_NAME = Object.fromEntries(Object.entries(NAME_TO_CODE).map(([n,c]) => [c,n]));

// [lat, lon, weight] — weight ~ station density
const CENTROID = {
  AL:[32.8,-86.8,7],AR:[34.8,-92.4,5],AZ:[34.2,-111.9,9],CA:[37.2,-119.5,22],CO:[39.0,-105.5,9],
  CT:[41.6,-72.7,5],DE:[39.0,-75.5,2],FL:[28.6,-81.6,16],GA:[32.9,-83.5,10],IA:[42.0,-93.5,5],
  ID:[44.2,-114.5,4],IL:[40.0,-89.2,11],IN:[39.9,-86.3,7],KS:[38.5,-98.4,4],KY:[37.8,-85.7,5],
  LA:[31.0,-92.0,5],MA:[42.3,-71.8,8],MD:[39.0,-76.7,7],ME:[45.4,-69.2,3],MI:[44.3,-85.4,9],
  MN:[46.3,-94.3,6],MO:[38.5,-92.5,7],MS:[32.7,-89.7,4],MT:[46.9,-110.0,3],NC:[35.5,-79.4,10],
  ND:[47.5,-100.5,2],NE:[41.5,-99.8,3],NH:[43.7,-71.6,3],NJ:[40.2,-74.7,8],NM:[34.4,-106.1,4],
  NV:[39.3,-116.9,6],NY:[42.9,-75.5,13],OH:[40.3,-82.8,10],OK:[35.6,-97.5,5],OR:[44.0,-120.5,6],
  PA:[40.9,-77.8,11],RI:[41.7,-71.5,2],SC:[33.9,-80.9,6],SD:[44.4,-100.2,2],TN:[35.9,-86.4,7],
  TX:[31.5,-99.3,20],UT:[39.3,-111.7,6],VA:[37.5,-78.9,9],VT:[44.1,-72.7,2],WA:[47.4,-120.5,9],
  WI:[44.6,-89.9,6],WV:[38.6,-80.6,3],WY:[43.0,-107.5,2],DC:[38.9,-77.0,1],
};

const CITIES = [
  ['Chattanooga','TN',35.045,-85.31],['Nashville','TN',36.16,-86.78],['Knoxville','TN',35.96,-83.92],
  ['Memphis','TN',35.15,-90.05],['Atlanta','GA',33.75,-84.39],['Savannah','GA',32.08,-81.09],
  ['Birmingham','AL',33.52,-86.81],['Montgomery','AL',32.37,-86.30],['Jackson','MS',32.30,-90.18],
  ['New Orleans','LA',29.95,-90.07],['Baton Rouge','LA',30.45,-91.19],['Little Rock','AR',34.75,-92.29],
  ['Charlotte','NC',35.23,-80.84],['Raleigh','NC',35.78,-78.64],['Asheville','NC',35.60,-82.55],
  ['Columbia','SC',34.00,-81.03],['Charleston','SC',32.78,-79.93],['Jacksonville','FL',30.33,-81.66],
  ['Orlando','FL',28.54,-81.38],['Tampa','FL',27.95,-82.46],['Miami','FL',25.76,-80.19],
  ['Tallahassee','FL',30.44,-84.28],['Louisville','KY',38.25,-85.76],['Lexington','KY',38.04,-84.50],
  ['Cincinnati','OH',39.10,-84.51],['Columbus','OH',39.96,-82.99],['Cleveland','OH',41.50,-81.69],
  ['Indianapolis','IN',39.77,-86.16],['Chicago','IL',41.88,-87.63],['St. Louis','MO',38.63,-90.20],
  ['Kansas City','MO',39.10,-94.58],['Springfield','MO',37.21,-93.29],['Des Moines','IA',41.59,-93.62],
  ['Omaha','NE',41.26,-95.93],['Wichita','KS',37.69,-97.34],['Oklahoma City','OK',35.47,-97.52],
  ['Tulsa','OK',36.15,-95.99],['Dallas','TX',32.78,-96.80],['Fort Worth','TX',32.76,-97.33],
  ['Austin','TX',30.27,-97.74],['San Antonio','TX',29.42,-98.49],['Houston','TX',29.76,-95.37],
  ['El Paso','TX',31.76,-106.49],['Amarillo','TX',35.22,-101.83],['Albuquerque','NM',35.08,-106.65],
  ['Santa Fe','NM',35.69,-105.94],['Denver','CO',39.74,-104.99],['Colorado Springs','CO',38.83,-104.82],
  ['Salt Lake City','UT',40.76,-111.89],['Cheyenne','WY',41.14,-104.82],['Casper','WY',42.87,-106.31],
  ['Billings','MT',45.78,-108.50],['Bozeman','MT',45.68,-111.04],['Boise','ID',43.62,-116.21],
  ['Phoenix','AZ',33.45,-112.07],['Tucson','AZ',32.22,-110.97],['Flagstaff','AZ',35.20,-111.65],
  ['Las Vegas','NV',36.17,-115.14],['Reno','NV',39.53,-119.81],['Los Angeles','CA',34.05,-118.24],
  ['San Diego','CA',32.72,-117.16],['San Francisco','CA',37.77,-122.42],['Sacramento','CA',38.58,-121.49],
  ['Fresno','CA',36.74,-119.79],['Portland','OR',45.52,-122.68],['Eugene','OR',44.05,-123.09],
  ['Seattle','WA',47.61,-122.33],['Spokane','WA',47.66,-117.43],['Minneapolis','MN',44.98,-93.27],
  ['Fargo','ND',46.88,-96.79],['Sioux Falls','SD',43.55,-96.70],['Rapid City','SD',44.08,-103.23],
  ['Milwaukee','WI',43.04,-87.91],['Madison','WI',43.07,-89.40],['Detroit','MI',42.33,-83.05],
  ['Grand Rapids','MI',42.96,-85.67],['Pittsburgh','PA',40.44,-79.99],['Philadelphia','PA',39.95,-75.17],
  ['Harrisburg','PA',40.27,-76.88],['Richmond','VA',37.54,-77.44],['Roanoke','VA',37.27,-79.94],
  ['Washington','DC',38.90,-77.04],['Baltimore','MD',39.29,-76.61],['New York','NY',40.71,-74.01],
  ['Buffalo','NY',42.89,-78.88],['Albany','NY',42.65,-73.75],['Boston','MA',42.36,-71.06],
  ['Portland','ME',43.66,-70.26],['Hartford','CT',41.76,-72.67],['Newark','NJ',40.74,-74.17],
];
const cityMap = {};
for (const [n,s,lat,lon] of CITIES) cityMap[n] = { name:n, state:s, lat, lon };
const city = (n) => cityMap[n];

/* ---- math --------------------------------------------------------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R = Math.PI/180;
function miles(a,b){const dLat=(b.lat-a.lat)*R,dLon=(b.lon-a.lon)*R,la1=a.lat*R,la2=b.lat*R;const x=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;return 3958.8*2*Math.asin(Math.min(1,Math.sqrt(x)));}
function nearestCity(lat,lon){let best=CITIES[0],bd=1e9;for(const c of CITIES){const d=(c[2]-lat)**2+(c[3]-lon)**2;if(d<bd){bd=d;best=c;}}return{name:best[0],state:best[1]};}
const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];

/* ---- station universe --------------------------------------------- */
const NAME_SUFFIX=['Supercharger','SC — Downtown','Town Center SC','Outlets SC','SC — Interstate','Travel Plaza SC','Midtown SC','Crossing SC'];
function buildStations(){
  const rng=mulberry32(90210);
  const byState={};
  const stations=[];
  let id=1;
  const codes=Object.keys(CENTROID);
  for(const code of codes){
    const [clat,clon,w]=CENTROID[code];
    const count=Math.max(3,Math.min(30,Math.round(w*1.5)));
    const stateCities=CITIES.filter(c=>c[1]===code);
    for(let i=0;i<count;i++){
      let alat,alon,cname;
      if(stateCities.length&&rng()<0.6){const c=stateCities[Math.floor(rng()*stateCities.length)];alat=c[2];alon=c[3];cname=c[0];}
      else{alat=clat;alon=clon;cname=CODE_TO_NAME[code];}
      const spread=stateCities.length?0.55:1.05;
      const lat=alat+(rng()-0.5)*spread;
      const lon=alon+(rng()-0.5)*spread*1.25;
      stations.push({
        id:'sc-'+id,sourceId:String(1000+id),source:'supercharge.info',
        name:`${cname} ${pick(rng,NAME_SUFFIX)}`,status:'OPEN',
        position:{lat,lon},address:{city:cname,state:code,country:'USA'},
        stallCount:pick(rng,[8,12,16,20,24,28,40]),powerKw:pick(rng,[150,250]),
        counted:true,otherEvs:rng()<0.3,
      });
      id++;
    }
    byState[code]=count;
  }
  return {stations,byState};
}

/* ---- route builder ------------------------------------------------ */
function polyline(coords,rng){
  const line=[START,...coords];
  const out=[];
  for(let i=0;i<line.length-1;i++){
    const a=line[i],b=line[i+1];
    const segMi=miles({lat:a.lat,lon:a.lon},{lat:b.lat,lon:b.lon});
    const steps=Math.max(6,Math.round(segMi/22));
    const dx=b.lon-a.lon,dy=b.lat-a.lat,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len; // perpendicular
    for(let s=0;s<steps;s++){
      const t=s/steps;
      const wobble=Math.sin(t*Math.PI)* (rng()-0.5)*0.9;
      out.push({lat:a.lat+dy*t+ny*wobble, lon:a.lon+dx*t+nx*wobble});
    }
  }
  out.push(line[line.length-1]);
  return out;
}

function ratingFor(rng,cities){
  const scenery=Math.round(45+rng()*50), cityScore=Math.round(45+rng()*50), landmark=Math.round(40+rng()*55);
  const score=Math.max(20,Math.min(100,Math.round((scenery+cityScore+landmark)/3+(rng()-0.4)*8)));
  const places=cities.slice(0,2).map((c,i)=>({id:'pl-'+c+i,type:i===0?'city':'landmark',label:c,rating:Math.round(60+rng()*38),sceneryScore:scenery,visits:1,summary:''}));
  const tone = score>=80?'Standout leg':score>=65?'Solid day':'Transit-heavy day';
  return {score,sceneryScore:scenery,cityScore,landmarkScore:landmark,places,summary:`${tone} · ${cities.slice(0,2).join(' & ')||'open road'}`};
}

function buildRoute(def){
  const rng=mulberry32(hash(def.id));
  const coords=def.waypoints.map(city).filter(Boolean);
  const line=polyline(coords,rng);
  const isLongest=def.plannerMode==='longest_trip';
  const targetH=isLongest?4.4:5.0, mph=60, range=220;

  // walk the line, drop stops ~ every gap miles
  const stops=[];
  let acc=0, prev=line[0], seq=0;
  for(let i=1;i<line.length;i++){
    acc+=miles(prev,line[i]);
    const gap=52+rng()*22;
    if(acc>=gap||i===line.length-1){
      const p=line[i];const nc=nearestCity(p.lat,p.lon);
      seq++;
      stops.push({seq,pos:p,city:nc.name,state:nc.state,leg:acc});
      acc=0;
    }
    prev=line[i];
  }

  // group into days
  const days=[]; let cur=[]; let dayH=0; let dayCap=targetH; let longFlag=false; let dayNo=0;
  const flush=(force)=>{
    if(!cur.length)return;
    dayNo++;
    const visits=cur.map(s=>{
      const legMiles=Math.round(s.leg);
      const driveHours=+(s.leg/mph).toFixed(2);
      const rangeWarning=s.leg>range;
      const connectorStop=s.leg>190&&rng()<0.7;
      const stopMinutes=s.leg<8?2:(rangeWarning?26:18);
      return {sequence:s.seq,day:dayNo,legMiles,driveHours,stopMinutes,rangeWarning,connectorStop,
        station:{id:'v-'+def.id+'-'+s.seq,sourceId:String(s.seq),source:'supercharge.info',name:`${s.city} Supercharger`,status:'OPEN',position:s.pos,address:{city:s.city,state:s.state,country:'USA'},stallCount:pick(rng,[8,12,16,20,24]),powerKw:pick(rng,[150,250]),counted:true,otherEvs:false}};
    });
    const dMiles=visits.reduce((a,v)=>a+v.legMiles,0);
    const dDrive=+visits.reduce((a,v)=>a+v.driveHours,0).toFixed(1);
    const dStop=visits.reduce((a,v)=>a+v.stopMinutes,0);
    const cities=[...new Set(visits.map(v=>v.station.address.city))];
    const warnings=visits.some(v=>v.rangeWarning)?[`${visits.filter(v=>v.rangeWarning).length} leg(s) exceed 220 mi practical range — plan an aux charge.`]:[];
    const advisories=[];
    if(longFlag)advisories.push({severity:'info',message:'Long-day boost: extra hours cleared the unique-site threshold.'});
    if(visits.some(v=>v.connectorStop))advisories.push({severity:'medium',message:'Includes a transfer connector Supercharger on a long repositioning leg.'});
    days.push({day:dayNo,miles:dMiles,driveHours:dDrive,stopMinutes:dStop,uniqueStations:visits.length,
      averageDistanceBetweenSuperchargers:Math.round(dMiles/Math.max(1,visits.length)),
      visits,warnings,advisories,longDayOptimized:longFlag,
      longDayReason:longFlag?'Added 3 unique sites for +2.1h drive — above your 2.5 sites/hr floor.':undefined,
      rating:ratingFor(rng,cities)});
    cur=[]; dayH=0; longFlag=false;
    dayCap = (dayNo % 6 === 5) ? (isLongest?7.4:7.8) : targetH; // occasional long day next
  };
  for(const s of stops){
    const h=s.leg/mph;
    if(dayH+h>dayCap && cur.length){ flush(); }
    if(dayCap>targetH+1 && !cur.length) longFlag=true;
    cur.push(s); dayH+=h;
  }
  flush(true);

  const allVisits=days.flatMap(d=>d.visits).map((v,i)=>({...v,sequence:i+1}));
  const uniqueStations=allVisits.length;
  const totalMiles=allVisits.reduce((a,v)=>a+v.legMiles,0);
  const totalDriveHours=+days.reduce((a,d)=>a+d.driveHours,0).toFixed(1);
  const totalStopHours=+(allVisits.reduce((a,v)=>a+v.stopMinutes,0)/60).toFixed(1);
  const totalDays=days.length;
  const longDays=days.filter(d=>d.longDayOptimized).length;
  const auxLegs=allVisits.filter(v=>v.rangeWarning).length;
  const routeWarnings=[]; const routeAdv=[];
  if(auxLegs>0)routeAdv.push({severity:'medium',message:`${auxLegs} legs need an auxiliary charge stop — flagged on the map and day rows.`});
  if(longDays>0)routeAdv.push({severity:'info',message:`${longDays} long-day boosts add unique sites above your efficiency floor.`});
  if(isLongest)routeAdv.push({severity:'info',message:'Longest-Trip mode maximizes consecutive charging days, not unique sites.'});
  const overallCities=allVisits.slice(0,2).map(v=>v.station.address.city);

  return {
    id:def.id,plannerMode:def.plannerMode,name:def.name,strategy:def.strategy,color:def.color,
    uniqueStations,totalMiles,totalDriveHours,totalStopHours,totalDays,
    averageMilesPerDay:Math.round(totalMiles/totalDays),
    averageDriveHoursPerDay:+(totalDriveHours/totalDays).toFixed(1),
    averageStopHoursPerDay:+(totalStopHours/totalDays).toFixed(1),
    averageDistanceBetweenSuperchargers:Math.round(totalMiles/Math.max(1,uniqueStations)),
    stationsPerDay:Math.round(uniqueStations/totalDays),
    days,visits:allVisits,warnings:routeWarnings,advisories:routeAdv,longDays,
    routeLine:line,rating:ratingFor(rng,overallCities),
  };
}

const ROUTE_DEFS=[
  {id:'deep-south',plannerMode:'most_unique_sites',name:'Deep South Loop',strategy:'Dense southeastern cluster sweep',color:'#ff453a',
   waypoints:['Nashville','Memphis','Little Rock','Jackson','New Orleans','Baton Rouge','Houston','Dallas','Oklahoma City','Tulsa','Springfield','St. Louis','Louisville','Nashville']},
  {id:'atlantic',plannerMode:'most_unique_sites',name:'Atlantic Seaboard',strategy:'I-95 corridor, max metros',color:'#0bd5d0',
   waypoints:['Knoxville','Asheville','Charlotte','Raleigh','Richmond','Washington','Baltimore','Philadelphia','New York','Hartford','Boston','Albany','Buffalo','Pittsburgh','Columbus','Cincinnati']},
  {id:'coast2coast',plannerMode:'most_unique_sites',name:'Coast to Coast',strategy:'Transcontinental unique-site run',color:'#f5a623',
   waypoints:['Nashville','Memphis','Little Rock','Oklahoma City','Amarillo','Albuquerque','Flagstaff','Las Vegas','Los Angeles','Fresno','Sacramento','Reno','Salt Lake City']},
  {id:'sunbelt',plannerMode:'longest_trip',name:'Sunbelt Marathon',strategy:'Longest consecutive-day streak, south',color:'#7c6cf0',
   waypoints:['Atlanta','Savannah','Jacksonville','Orlando','Tampa','Miami','Tallahassee','New Orleans','Houston','San Antonio','Austin','Dallas','Oklahoma City','Wichita','Kansas City']},
  {id:'northern-arc',plannerMode:'longest_trip',name:'Northern Arc',strategy:'Longest streak across the north',color:'#34c759',
   waypoints:['Louisville','Indianapolis','Chicago','Milwaukee','Minneapolis','Fargo','Sioux Falls','Rapid City','Billings','Bozeman','Boise','Spokane','Seattle','Portland','Eugene']},
];

function buildStateStats(route,byState){
  const routeByState={};
  for(const v of route.visits){const st=v.station.address.state;routeByState[st]=(routeByState[st]||0)+1;}
  const rows=[];
  for(const code of Object.keys(byState)){
    const routeStations=routeByState[code]||0;
    const total=byState[code];
    const milesIn=route.visits.filter(v=>v.station.address.state===code).reduce((a,v)=>a+v.legMiles,0);
    rows.push({country:'USA',state:code,stateName:CODE_TO_NAME[code],routeStations,totalStations:total,
      coveragePct:Math.round((routeStations/Math.max(1,total))*100),miles:Math.round(milesIn)});
  }
  return rows.sort((a,b)=>b.routeStations-a.routeStations);
}

export function createDataset(){
  const {stations,byState}=buildStations();
  const routes=ROUTE_DEFS.map(buildRoute);
  for(const r of routes) r.stateStats=buildStateStats(r,byState);
  const filtered=stations.length;
  const totalOpen=Math.round(filtered*1.27);
  const target=650, availableDays=63;
  const required=Math.ceil(target/availableDays);
  const universe={
    totalOpenStations:totalOpen,filteredStations:filtered,
    countryCounts:{USA:filtered},
    allSitesFeasibility:{totalStations:filtered,availableDays,requiredStationsPerDay:required,
      minimumStopHours:required*0.03,distanceStopHours:required*0.3,
      verdict: required<=11?'plausible':required<=16?'aggressive':'not_plausible',
      explanation:`Visiting all ${filtered.toLocaleString()} filtered open sites in ${availableDays} days needs ${required} sites/day — reachable in dense corridors but tight across sparse western legs.`},
  };
  const source={name:'Supercharge.info',url:'https://supercharge.info',fetchedAt:new Date(Date.now()-1000*60*37).toISOString()};
  return {start:START,stations,routes,universe,source,stateByCount:byState};
}
