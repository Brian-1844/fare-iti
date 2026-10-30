/* Fare Iti — game data: icons, items, crops, recipes, levels, animals. */
(function(){
"use strict";
const SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"';
const sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
const bottle=(liquid,deco='')=>sv(`<path d="M9 3h6v3l2 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3Z" fill="#f6efd8" ${SK}/><path d="M7.8 12h8.4v8a1.4 1.4 0 0 1-1.4 1.4H9.2A1.4 1.4 0 0 1 7.8 20Z" fill="${liquid}"/><rect x="9" y="2" width="6" height="3" rx="1" fill="#8a5a33" ${SK}/>${deco}`);
const sprout=(base,leaf)=>sv(`<ellipse cx="12" cy="18" rx="4" ry="3.2" fill="${base}" ${SK}/><path d="M12 15C11 9 7 6 4 6c2 4 5 6 8 9Z" fill="${leaf}" ${SK}/><path d="M12 15c1-6 5-9 8-9-2 4-5 6-8 9Z" fill="${leaf}" ${SK}/>`);

const ICON={
 log:sv(`<rect x="3" y="8" width="15" height="8" rx="2" fill="#8a5a33" ${SK}/><ellipse cx="18" cy="12" rx="3" ry="4" fill="#e3b77c" ${SK}/><circle cx="18" cy="12" r="1.2" fill="#a8743f"/>`),
 plank:sv(`<rect x="3" y="6" width="18" height="5" rx="1" fill="#d39e62" ${SK}/><rect x="3" y="13" width="18" height="5" rx="1" fill="#c38c51" ${SK}/><path d="M7 8.5h5M10 15.5h6" stroke="#9a6a38" stroke-width="1.2"/>`),
 coconut:sv(`<circle cx="12" cy="13" r="7.5" fill="#7a5530" ${SK}/><circle cx="9.6" cy="11" r="1.1" fill="#2c1d10"/><circle cx="14.4" cy="11" r="1.1" fill="#2c1d10"/><circle cx="12" cy="14.6" r="1.1" fill="#2c1d10"/>`),
 frond:sv(`<path d="M3 20C8 10 14 5 21 4 20 11 14 17 3 20Z" fill="#58a845" ${SK}/><path d="M5 18 19 6M9 14l-2-3M12 11l-1-4M14 9l3 1M11 13l3 2" stroke="#2f6e27" stroke-width="1.2"/>`),
 rope:sv(`<circle cx="12" cy="12" r="7.5" fill="none" stroke="#14313a" stroke-width="5"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#c9a061" stroke-width="3" stroke-dasharray="3 1.6"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="#14313a" stroke-width="1.6"/>`),
 thatch:sv(`<path d="M2 9 12 4l10 5v9H2Z" fill="#d6b062" ${SK}/><path d="M5 9v9M8 7.6V18M11 6.2V18M14 6.4V18M17 7.8V18M20 9v9" stroke="#a37d34" stroke-width="1.1"/><path d="M2 12.5h20" stroke="#14313a" stroke-width="1.2"/>`),
 stone:sv(`<path d="M4 16 6 8l7-3 6 4 2 7-6 4H8Z" fill="#6c6a64" ${SK}/><path d="M6 8l5 3 2-6M11 11l4 9M11 11l8-2" stroke="#4b4944" stroke-width="1.1"/>`),
 bamboo:sv(`<rect x="6" y="2" width="4" height="20" rx="1.5" fill="#9cbf4a" ${SK}/><rect x="13" y="4" width="4" height="18" rx="1.5" fill="#b5cf5e" ${SK}/><path d="M6 8h4M6 15h4M13 10h4M13 16h4" stroke="#14313a" stroke-width="1.4"/><path d="M17 5c2-2 4-2 5-1-2 1-3 2-5 1Z" fill="#6aa43c" ${SK}/>`),
 strips:sv(`<path d="M2 14 14 2l2 1L4 16Z" fill="#e6d08c" ${SK}/><path d="M3 18 17 4l2 2L5 20Z" fill="#d9c27a" ${SK}/><path d="M7 21 21 7l1 2L9 22Z" fill="#c9ae5f" ${SK}/>`),
 oil:bottle('#e5b84a'),
 monoi:bottle('#f0c75a',`<circle cx="12" cy="16" r="3.2" fill="#fff" ${SK}/><circle cx="12" cy="16" r="1" fill="#ffc83d"/>`),
 vmonoi:bottle('#b8864a',`<path d="M9.5 19.5 14.5 13" stroke="#3a2416" stroke-width="2.2" stroke-linecap="round"/>`),
 tiare:sv(`<g fill="#ffffff" ${SK}>${[0,60,120,180,240,300].map(a=>`<ellipse cx="12" cy="6.6" rx="2.5" ry="4.8" transform="rotate(${a} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="2.2" fill="#ffc83d" ${SK}/>`),
 vanilla:sv(`<path d="M5 20C9 15 14 9 19 3" stroke="#14313a" stroke-width="4.4" stroke-linecap="round" fill="none"/><path d="M5 20C9 15 14 9 19 3" stroke="#5a3a1c" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M8 16c2 1 3 0 4-1" stroke="#8a6238" stroke-width="1" fill="none"/>`),
 oo:sv(`<path d="M4 20 17 7" stroke="#14313a" stroke-width="4.2" stroke-linecap="round"/><path d="M4 20 17 7" stroke="#a87a4e" stroke-width="2.4" stroke-linecap="round"/><path d="M16 8 21 2l-1.5 6.5Z" fill="#c69a6a" ${SK}/>`),
 ipu:sv(`<path d="M3 10h18c0 6-4 10-9 10S3 16 3 10Z" fill="#7a5530" ${SK}/><ellipse cx="12" cy="10" rx="9" ry="2.4" fill="#e9dcc0" ${SK}/>`),
 water:sv(`<path d="M3 11h18c0 6-4 10-9 10S3 17 3 11Z" fill="#7a5530" ${SK}/><ellipse cx="12" cy="11" rx="9" ry="2.4" fill="#5cc3e0" ${SK}/><path d="M12 1.5c2 3 2.5 4 2.5 5a2.5 2.5 0 0 1-5 0c0-1 .5-2 2.5-5Z" fill="#5cc3e0" ${SK}/>`),
 banana:sv(`<path d="M5 5c1 9 6 13 14 12 1.5-.2 1.4-2.2 0-2.2C13 15 9.5 11 8.5 5 8.2 3.4 4.8 3.4 5 5Z" fill="#f2c94c" ${SK}/><path d="M6.5 6c1 6 4 9 9 10" stroke="#c99a1e" stroke-width="1.1" fill="none"/><path d="M5.4 4.2 5 2.5" stroke="#14313a" stroke-width="1.8" stroke-linecap="round"/>`),
 fei:sv(`<path d="M12 22V9" stroke="#14313a" stroke-width="2"/><g fill="#d9601e" ${SK}><ellipse cx="9" cy="8" rx="2.4" ry="3.6"/><ellipse cx="15" cy="8" rx="2.4" ry="3.6"/><ellipse cx="12" cy="5.5" rx="2.4" ry="3.6"/><ellipse cx="12" cy="11.5" rx="2.4" ry="3.4"/></g>`),
 taro:sv(`<path d="M12 9c5 0 7 4 6 8s-4 5-6 5-5-1-6-5 1-8 6-8Z" fill="#8c6a7a" ${SK}/><path d="M9 14c1 1 2 1 3 0M12 18c1 1 2 1 3 0" stroke="#5a3e4c" stroke-width="1.1" fill="none"/><path d="M12 9V5" stroke="#14313a" stroke-width="1.6"/><path d="M12 5 7 2c0 3 2 4 5 3 3 1 5 0 5-3Z" fill="#4c9a44" ${SK}/>`),
 uru:sv(`<circle cx="12" cy="13" r="8" fill="#9cc23f" ${SK}/><path d="M7 10l2 2-2 2M12 8l2 2-2 2M17 10l-2 2 2 2M10 16l2 2 2-2" stroke="#5e7d22" stroke-width="1.1" fill="none"/><path d="M12 5V2" stroke="#14313a" stroke-width="1.8"/>`),
 fish:sv(`<path d="M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3Z" fill="#4aa7c9" ${SK}/><circle cx="7.5" cy="11" r="1.1" fill="#14313a"/><path d="M10 9.5c1 1.5 1 3.5 0 5" stroke="#2c7896" stroke-width="1.1" fill="none"/>`),
 egg:sv(`<path d="M12 3c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11Z" fill="#f6ecd6" ${SK}/><path d="M9 9c.5-1 1-1.6 1.6-2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`),
 milk:sv(`<path d="M6 6h12l-1.5 14h-9Z" fill="#ffffff" ${SK}/><path d="M6.4 9.5h11.2" stroke="#14313a" stroke-width="1.2"/><path d="M8 4h8" stroke="#14313a" stroke-width="1.6" stroke-linecap="round"/>`),
 grillfish:sv(`<path d="M3 12c3-5 9-6 13-3l4-3v12l-4-3c-4 3-10 2-13-3Z" fill="#b8763a" ${SK}/><path d="M8 8.5l4 7M11 8l4 7M14 8.5l2.5 4.5" stroke="#5a3214" stroke-width="1.3"/><circle cx="6.5" cy="11" r="1" fill="#14313a"/>`),
 roastfei:sv(`<ellipse cx="12" cy="13" rx="8" ry="5" fill="#b4461a" ${SK}/><path d="M7 11.5l2 2M11 10l1.5 2.5M15 11l1.6 2" stroke="#3a1608" stroke-width="1.4" stroke-linecap="round"/><path d="M9 6c0-2 2-2 2-4M13 6c0-2 2-2 2-4" stroke="#8a8a8a" stroke-width="1.3" fill="none" stroke-linecap="round"/>`),
 ctaro:sv(`<ellipse cx="9" cy="15" rx="6" ry="5" fill="#b9a3c9" ${SK}/><ellipse cx="15" cy="12" rx="6" ry="5" fill="#cbb7d8" ${SK}/><path d="M12 6c0-2 2-2 2-4" stroke="#8a8a8a" stroke-width="1.3" fill="none" stroke-linecap="round"/>`),
 ruru:sv(`<circle cx="12" cy="13" r="8" fill="#3d2a1a" ${SK}/><path d="M6 13a6 6 0 0 1 12 0Z" fill="#f2e2b5" ${SK}/>`),
 poe:sv(`<path d="M2 16c4-8 16-8 20 0-6 4-14 4-20 0Z" fill="#5fa64a" ${SK}/><rect x="7" y="9" width="10" height="6" rx="1.5" fill="#d9822b" ${SK}/><path d="M7 11.5h10" stroke="#f3ead2" stroke-width="1.4"/>`),
 iaota:sv(`<path d="M3 11h18c0 5-4 9-9 9s-9-4-9-9Z" fill="#f3ead2" ${SK}/><rect x="6" y="8" width="3.4" height="3.4" rx=".6" fill="#f0a07e" ${SK}/><rect x="10.5" y="7" width="3.4" height="3.4" rx=".6" fill="#f0a07e" ${SK}/><rect x="15" y="8.3" width="3" height="3" rx=".6" fill="#7cc04e" ${SK}/>`),
 bshoot:sprout('#9a7b4a','#8fd05e'),
 fshoot:sprout('#c3602a','#3f8a3a'),
 taroshoot:sv(`<ellipse cx="12" cy="19" rx="4" ry="3" fill="#8c6a7a" ${SK}/><path d="M12 16V9" stroke="#14313a" stroke-width="1.6"/><path d="M12 10 5 6c0 4 3 6 7 4 4 2 7 0 7-4Z" fill="#4c9a44" ${SK}/>`),
 tcut:sv(`<path d="M5 21 15 8" stroke="#6b4a2a" stroke-width="2" stroke-linecap="round"/><path d="M10 15c-4 0-6-2-6-5 3 0 5 2 6 5Z" fill="#3f8a3a" ${SK}/><circle cx="16.5" cy="6.5" r="4" fill="#fff" ${SK}/><circle cx="16.5" cy="6.5" r="1.3" fill="#ffc83d"/>`),
 usap:sv(`<path d="M12 22V11" stroke="#6b4a2a" stroke-width="2"/><path d="M12 12C6 12 3 8 4 3c3 0 4 2 5 3 0-2 1-3 3-4 2 1 3 2 3 4 1-1 2-3 5-3 1 5-2 9-8 9Z" fill="#3f8a3a" ${SK}/>`),
 vcut:sv(`<path d="M8 21V4" stroke="#a87a4e" stroke-width="2.2"/><path d="M8 18c4 0 6-2 6-4s-6-2-6-4 4-3 7-3" stroke="#4c9a44" stroke-width="2" fill="none"/><path d="M15 7c2-2 4-1 5 0-1 2-3 2-5 0Z" fill="#6ab04c" ${SK}/>`),
 fire:sv(`<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-3 1-6 1-9Z" fill="#f08a2b" ${SK}/><path d="M12 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2 1-3 1 .5 1.5 1.5 1.5 2.5.5-1.5.5-3 .5-4.5Z" fill="#ffd25e"/>`),
 canoe:sv(`<path d="M2 13h20c-2 4-6 5-10 5S4 17 2 13Z" fill="#7a4a28" ${SK}/><path d="M6 13V9M18 13V9" stroke="#14313a" stroke-width="1.6"/><rect x="4" y="7.5" width="16" height="2" rx="1" fill="#a87a4e" ${SK}/>`),
 mat:sv(`<rect x="3" y="6" width="18" height="12" rx="1.5" fill="#d9c27a" ${SK}/><path d="M7 6v12M11 6v12M15 6v12M19 6v12M3 10h18M3 14h18" stroke="#a8893f" stroke-width="1"/>`),
 bed:sv(`<rect x="2" y="11" width="20" height="5" rx="1" fill="#bb8b57" ${SK}/><rect x="3" y="8" width="17" height="4" rx="1" fill="#de4634" ${SK}/><circle cx="8" cy="10" r="1" fill="#fff"/><circle cx="13" cy="10" r="1" fill="#fff"/><path d="M3 16v3M21 16v3" stroke="#14313a" stroke-width="1.8"/>`),
 shelf:sv(`<path d="M4 3v18M20 3v18" stroke="#14313a" stroke-width="1.8"/><path d="M4 8h16M4 14h16M4 20h16" stroke="#bb8b57" stroke-width="2.6"/><rect x="7" y="3.6" width="3" height="4" fill="#f2d98a" ${SK}/><rect x="13" y="9.6" width="4" height="4" fill="#7a5530" ${SK}/>`),
 lamp:sv(`<path d="M5 15h14c0 3-3 5-7 5s-7-2-7-5Z" fill="#7a5530" ${SK}/><path d="M12 4c1 3 3 4 3 7a3 3 0 0 1-6 0c0-3 2-4 3-7Z" fill="#ffd25e" ${SK}/>`),
 trap:sv(`<path d="M3 9h12l6 3-6 3H3Z" fill="#d9c27a" ${SK}/><path d="M6 9v6M9 9v6M12 9v6" stroke="#a8893f" stroke-width="1"/>`),
 coop:sv(`<path d="M3 11 12 4l9 7" fill="#d6b062" ${SK}/><rect x="5" y="11" width="14" height="8" fill="#bb8b57" ${SK}/><rect x="10" y="14" width="4" height="5" fill="#14313a"/>`),
 pen:sv(`<path d="M3 8v12M9 8v12M15 8v12M21 8v12" stroke="#6e4b2c" stroke-width="2.4"/><path d="M2 11h20M2 16h20" stroke="#c9a061" stroke-width="2"/>`),
 bowl:sv(`<path d="M3 11h18c0 5-4 9-9 9s-9-4-9-9Z" fill="#de4634" ${SK}/><path d="M8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4" stroke="#14313a" stroke-width="1.5" fill="none" stroke-linecap="round"/>`),
 bag:sv(`<path d="M5 8h14l-1 13H6Z" fill="#d6b062" ${SK}/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#14313a" stroke-width="1.8" fill="none"/>`),
 heart:sv(`<path d="M12 20S3 14 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14 12 20 12 20Z" fill="#de4634" ${SK}/>`),
 paw:sv(`<ellipse cx="12" cy="16" rx="5" ry="4" fill="#8a5a33" ${SK}/><g fill="#8a5a33" ${SK}><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6.5" r="2"/><circle cx="14" cy="6.5" r="2"/><circle cx="18" cy="10" r="2"/></g>`),
 pineapple:sv(`<path d="M12 9 8 2l3 3 1-4 1 4 3-3Z" fill="#4c9a44" ${SK}/><ellipse cx="12" cy="15" rx="5.5" ry="7" fill="#e5a43a" ${SK}/><path d="M8 11l8 8M16 11l-8 8M7.5 15h9" stroke="#a8681a" stroke-width="1"/>`),
 papaya:sv(`<path d="M12 3c4 0 6 5 6 10s-2.5 8-6 8-6-3-6-8 2-10 6-10Z" fill="#f08a2b" ${SK}/><path d="M12 8c1.6 0 2.5 2.5 2.5 5s-1 4-2.5 4-2.5-1.5-2.5-4S10.4 8 12 8Z" fill="#f6c56a"/><g fill="#2c1d10"><circle cx="12" cy="11" r=".8"/><circle cx="11.3" cy="13.5" r=".8"/><circle cx="12.8" cy="14.6" r=".8"/></g>`),
 lime:sv(`<circle cx="12" cy="13" r="7.5" fill="#8cc63f" ${SK}/><circle cx="12" cy="13" r="4.6" fill="#d4ec8a"/><path d="M12 8.4v9.2M7.4 13h9.2M8.8 9.8l6.4 6.4M15.2 9.8l-6.4 6.4" stroke="#8cc63f" stroke-width="1"/><path d="M12 5.5c1-2 3-3 5-3-1 2-3 3-5 3Z" fill="#4c9a44" ${SK}/>`),
 flour:sv(`<path d="M6 7h12l1 14H5Z" fill="#f6f1e6" ${SK}/><path d="M6 7l2-3h8l2 3" fill="#e9dcc0" ${SK}/><path d="M9 13h6M9 16h6" stroke="#14313a" stroke-width="1.3"/>`),
 firifiri:sv(`<path d="M5 15c-2-5 2-9 5-7 2-3 7-2 7 2 3 0 4 5 1 7-3 3-10 3-13-2Z" fill="#d9952f" ${SK}/><path d="M9 12c1 1 3 1 4 0" stroke="#8a5a1a" stroke-width="1.2" fill="none"/>`),
 iaota2:sv(`<path d="M3 11h18c0 5-4 9-9 9s-9-4-9-9Z" fill="#f3ead2" ${SK}/><rect x="6" y="8" width="3.4" height="3.4" rx=".6" fill="#f0a07e" ${SK}/><rect x="10.5" y="7" width="3.4" height="3.4" rx=".6" fill="#f0a07e" ${SK}/><path d="M15 11a3.5 3.5 0 0 1 7 0Z" fill="#8cc63f" ${SK}/>`),
 hei:sv(`<circle cx="12" cy="12" r="7" fill="none" stroke="#4c9a44" stroke-width="2.4"/><g fill="#ffffff" ${SK}>${[0,45,90,135,180,225,270,315].map(a=>`<circle cx="${(12+7*Math.cos(a*Math.PI/180)).toFixed(1)}" cy="${(12+7*Math.sin(a*Math.PI/180)).toFixed(1)}" r="2.3"/>`).join('')}</g>`),
 pinetop:sv(`<path d="M12 13 7 3l4 4 1-5 1 5 4-4Z" fill="#4c9a44" ${SK}/><path d="M8 13h8l-1 6a3 3 0 0 1-6 0Z" fill="#e5a43a" ${SK}/>`),
 papseed:sv(`<path d="M4 16c0-5 4-9 8-9s8 4 8 9Z" fill="#f08a2b" ${SK}/><g fill="#2c1d10"><circle cx="9" cy="13" r="1.2"/><circle cx="12" cy="11.5" r="1.2"/><circle cx="15" cy="13" r="1.2"/><circle cx="12" cy="14.5" r="1.2"/></g>`),
 limesap:sv(`<path d="M12 22V12" stroke="#6b4a2a" stroke-width="2"/><circle cx="12" cy="9" r="6" fill="#3f8a3a" ${SK}/><circle cx="9.5" cy="10" r="1.6" fill="#8cc63f" ${SK}/><circle cx="14.5" cy="8" r="1.6" fill="#8cc63f" ${SK}/>`),
 xpf:sv(`<circle cx="12" cy="12" r="9" fill="#e9c35a" ${SK}/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#a8812a" stroke-width="1.2"/><path d="M10 8h4.5M10 8v8M10 11.8h3.5" stroke="#14313a" stroke-width="1.8" stroke-linecap="round"/>`),
 star:sv(`<path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z" fill="#ffc83d" ${SK}/>`),
 guest:sv(`<circle cx="12" cy="8" r="3.6" fill="#c98a5a" ${SK}/><path d="M5 21c0-5 3-8 7-8s7 3 7 8Z" fill="#4aa7c9" ${SK}/><path d="M6 6.5h12M8.5 6.5c0-2.2 1.6-3.6 3.5-3.6s3.5 1.4 3.5 3.6" fill="#f2d98a" stroke="#14313a" stroke-width="1.6"/>`),
 hooks:sv(`<path d="M14 2v11a4 4 0 0 1-8 0v-1" stroke="#14313a" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M14 2v11a4 4 0 0 1-8 0v-1" stroke="#b9c3c6" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M6 12 4 15" stroke="#14313a" stroke-width="1.8" stroke-linecap="round"/>`),
 machete:sv(`<path d="M3 20 6 17l1 1-3 3Z" fill="#6b4a2a" ${SK}/><path d="M6.5 16.5 18 4c2.5 0 3 2 2.5 3.5L8 18Z" fill="#c9d2d4" ${SK}/>`),
 motor:sv(`<rect x="7" y="2" width="9" height="8" rx="2" fill="#de4634" ${SK}/><path d="M11 10v8" stroke="#14313a" stroke-width="2.4"/><path d="M8 19c2-1 5-1 7 0l-1 3H9Z" fill="#9aa4a7" ${SK}/>`),
 quilt:sv(`<rect x="3" y="4" width="18" height="16" rx="1.5" fill="#d6392c" ${SK}/><g fill="#fbf3e2">${[0,45,90,135].map(a=>`<ellipse cx="12" cy="12" rx="1.6" ry="5.6" transform="rotate(${a} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="1.6" fill="#d6392c"/>`),
 ukulele:sv(`<circle cx="9" cy="16" r="4.6" fill="#b8763a" ${SK}/><circle cx="12" cy="12.5" r="3.4" fill="#b8763a" ${SK}/><circle cx="9.5" cy="15.5" r="1.3" fill="#3a2416"/><path d="M13 11.5 20 4.5" stroke="#14313a" stroke-width="2.6" stroke-linecap="round"/><path d="M13 11.5 20 4.5" stroke="#6b4a2a" stroke-width="1.2"/>`),
 hammock:sv(`<path d="M3 4v16M21 4v16" stroke="#6e4b2c" stroke-width="2.4"/><path d="M3 8c4 9 14 9 18 0" fill="none" stroke="#14313a" stroke-width="4"/><path d="M3 8c4 9 14 9 18 0" fill="none" stroke="#de4634" stroke-width="2.2" stroke-dasharray="3 2"/>`),
 kayak:sv(`<path d="M1 14c5-3 17-3 22 0-5 3-17 3-22 0Z" fill="#ffc83d" ${SK}/><ellipse cx="12" cy="13.6" rx="2.6" ry=".9" fill="#14313a"/><path d="M5 20 19 6" stroke="#14313a" stroke-width="1.6"/>`),
 paint:sv(`<path d="M5 9h11v11H5Z" fill="#f6f1e6" ${SK}/><path d="M5 9h11v3H5Z" fill="#2fb3b0"/><path d="M8 9V6a2 2 0 0 1 4 0v3" fill="none" stroke="#14313a" stroke-width="1.5"/><path d="M16 13c3 0 4 1 4 3" stroke="#2fb3b0" stroke-width="2.4" stroke-linecap="round"/>`),
 stall:sv(`<path d="M2 9 5 4h14l3 5Z" fill="#d6b062" ${SK}/><path d="M4 9v11M20 9v11" stroke="#14313a" stroke-width="1.8"/><rect x="3" y="13" width="18" height="3" fill="#bb8b57" ${SK}/><circle cx="8" cy="12" r="1.6" fill="#f2c94c" ${SK}/><circle cx="12" cy="12" r="1.6" fill="#f08a2b" ${SK}/><circle cx="16" cy="12" r="1.6" fill="#7a5530" ${SK}/>`),
 gbed:sv(`<rect x="2" y="11" width="20" height="5" rx="1" fill="#bb8b57" ${SK}/><rect x="3" y="8" width="17" height="4" rx="1" fill="#f6f1e6" ${SK}/><path d="M3 16v3M21 16v3" stroke="#14313a" stroke-width="1.8"/><path d="M17 3v6M14 6h6" stroke="#14313a" stroke-width="2" stroke-linecap="round"/>`),
 ship:sv(`<path d="M2 14h20l-3 6H5Z" fill="#f6f1e6" ${SK}/><path d="M2 14h20l-.8 1.8H2.8Z" fill="#de4634"/><rect x="12" y="8" width="6" height="6" fill="#f6f1e6" ${SK}/><path d="M7 14V3M7 4l-4 7h4" stroke="#14313a" stroke-width="1.6" fill="#f2e2b5"/>`),
 lock:sv(`<rect x="5" y="10" width="14" height="10" rx="2" fill="#d8d0bd" ${SK}/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#14313a" stroke-width="1.8" fill="none"/>`)
};
const WXICON={
 sun:`<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="6" fill="#ffc83d" ${SK}/><g stroke="#14313a" stroke-width="1.8" stroke-linecap="round"><path d="M14 2.5v3M14 22.5v3M2.5 14h3M22.5 14h3M5.8 5.8l2 2M20.2 20.2l2 2M5.8 22.2l2-2M20.2 7.8l2-2"/></g></svg>`,
 moon:`<svg viewBox="0 0 28 28"><path d="M19 4a10 10 0 1 0 5 15A8 8 0 0 1 19 4Z" fill="#f3e7b5" ${SK}/><circle cx="7" cy="6" r="1" fill="#14313a"/><circle cx="23" cy="9" r=".9" fill="#14313a"/></svg>`,
 cloud:`<svg viewBox="0 0 28 28"><circle cx="18" cy="9" r="4.5" fill="#ffc83d" ${SK}/><path d="M7 21a5 5 0 0 1 1-9.9A6 6 0 0 1 19.5 13 4 4 0 0 1 20 21Z" fill="#f2f4f2" ${SK}/></svg>`,
 rain:`<svg viewBox="0 0 28 28"><path d="M7 16a5 5 0 0 1 1-9.9A6 6 0 0 1 19.5 8 4 4 0 0 1 20 16Z" fill="#c9d3d6" ${SK}/><g stroke="#2c7fb8" stroke-width="2" stroke-linecap="round"><path d="M9 19l-1.5 4M14 19l-1.5 4M19 19l-1.5 4"/></g></svg>`,
 storm:`<svg viewBox="0 0 28 28"><path d="M7 16a5 5 0 0 1 1-9.9A6 6 0 0 1 19.5 8 4 4 0 0 1 20 16Z" fill="#7d8b90" ${SK}/><path d="M14 15l-3 6h3l-2 5 6-8h-3l2-3Z" fill="#ffd25e" ${SK}/></svg>`
};

/* cat: food | mat (materials) | plant (things to plant) | tool */
const ITEMS={
 coconut:{n:'Coconut',t:'haʻari',food:12,cat:'food'},
 banana:{n:'Banana',t:'meiʻa',food:18,cat:'food'},
 fish:{n:'Fish',t:'iʻa',food:12,cat:'food'},
 egg:{n:'Egg',t:'huero moa',food:14,cat:'food'},
 milk:{n:'Goat milk',food:15,cat:'food'},
 grillfish:{n:'Grilled fish',food:30,cat:'food'},
 roastfei:{n:'Roasted fei',food:35,cat:'food'},
 ctaro:{n:'Cooked taro',food:40,cat:'food'},
 ruru:{n:'Roasted ʻuru',t:'breadfruit',food:45,cat:'food'},
 iaota:{n:'Poisson cru',t:'iʻa ota',food:45,cat:'food'},
 poe:{n:'Poʻe',t:'banana pudding',food:50,cat:'food'},
 pineapple:{n:'Pineapple',t:'painapo',food:20,cat:'food'},
 papaya:{n:'Papaya',t:'ʻīʻītā',food:16,cat:'food'},
 firifiri:{n:'Firi firi',t:'coconut doughnuts',food:25,cat:'food'},
 iaota2:{n:'Poisson cru tahitien',t:'with lime and coconut milk',food:55,cat:'food'},
 lime:{n:'Lime',t:'taporo',cat:'food'},
 fei:{n:'Fei',t:'roast it before eating',cat:'food'},
 taro:{n:'Taro',t:'cook it before eating',cat:'food'},
 uru:{n:'ʻUru',t:'breadfruit · roast it first',cat:'food'},
 frond:{n:'Frond',t:'niau',cat:'mat'},
 log:{n:'Log',t:'rāʻau',cat:'mat'},
 stone:{n:'Stone',t:'ʻōfaʻi',cat:'mat'},
 plank:{n:'Plank',cat:'mat'},
 rope:{n:'Rope',t:'nape',cat:'mat'},
 thatch:{n:'Thatch',cat:'mat'},
 bamboo:{n:'Bamboo',t:'ʻofe',cat:'mat'},
 strips:{n:'Bamboo strips',t:'for weaving',cat:'mat'},
 oil:{n:'Coconut oil',t:'hinu',cat:'mat'},
 tiare:{n:'Tiare flower',cat:'mat'},
 vanilla:{n:'Vanilla pod',t:'vanira',cat:'mat'},
 flour:{n:'Flour',t:'from the goélette',cat:'mat'},
 bshoot:{n:'Banana shoot',cat:'plant'},
 fshoot:{n:'Fei shoot',t:'mountain slopes only',cat:'plant'},
 taroshoot:{n:'Taro top',t:'plant in a flooded trench',cat:'plant'},
 tcut:{n:'Tiare cutting',cat:'plant'},
 usap:{n:'ʻUru shoot',t:'breadfruit tree',cat:'plant'},
 vcut:{n:'Vanilla cutting',cat:'plant'},
 pinetop:{n:'Pineapple top',cat:'plant'},
 papseed:{n:'Papaya seeds',cat:'plant'},
 limesap:{n:'Lime sapling',cat:'plant'},
 oo:{n:'Digging stick',t:'dig taro trenches',cat:'tool'},
 ipu:{n:'Coconut cup',t:'ipu · fill it at the spring',cat:'tool'},
 water:{n:'Cup of water',t:'pape',cat:'tool'},
 monoi:{n:'Monoʻi',t:'tap to apply',cat:'tool',use:true},
 vmonoi:{n:'Vanilla monoʻi',t:'tap to apply',cat:'tool',use:true},
 hei:{n:'Hei tiare',t:'flower crown to welcome a guest',cat:'tool'}
};
const ORDER=Object.keys(ITEMS);
const CATS=[['food','Food'],['mat','Materials'],['plant','To plant'],['tool','Tools and goods']];

/* Plants that grow from the ground. place: where they take. */
const CROPS={
 banana:{n:'banana',grow:70,regrow:45,yield:{banana:3},shoot:'bshoot',shootCd:60,place:'low'},
 fei:{n:'fei',grow:90,regrow:55,yield:{fei:2},shoot:'fshoot',shootCd:60,place:'slope'},
 taro:{n:'taro',grow:80,regrow:60,yield:{taro:1},shoot:'taroshoot',shootCd:50,place:'none'},
 tiare:{n:'tiare',grow:60,regrow:40,yield:{tiare:3},shoot:'tcut',shootCd:120,place:'low'},
 uru:{n:'ʻuru',grow:120,regrow:60,yield:{uru:2},shoot:'usap',shootCd:150,place:'low'},
 vanilla:{n:'vanilla',grow:100,regrow:80,yield:{vanilla:1},shoot:'vcut',shootCd:150,place:'low'},
 pineapple:{n:'pineapple',grow:90,regrow:70,yield:{pineapple:1},shoot:'pinetop',shootCd:120,place:'low'},
 papaya:{n:'papaya',grow:100,regrow:50,yield:{papaya:2},shoot:'papseed',shootCd:120,place:'low'},
 lime:{n:'lime',grow:110,regrow:50,yield:{lime:3},shoot:'limesap',shootCd:200,place:'low'}
};
const SEEDS={coconut:'palm',bshoot:'banana',fshoot:'fei',tcut:'tiare',usap:'uru',vcut:'vanilla',pinetop:'pineapple',papseed:'papaya',limesap:'lime'};

const STAGES=[
 {n:'Paepae',d:'raised stone platform',need:{stone:8}},
 {n:'Pou',d:'four corner posts',need:{log:4}},
 {n:'Frame',d:'beams, ridge and rafters',need:{plank:6,rope:2}},
 {n:'Walls',d:'plank walls with a doorway',need:{plank:6,rope:2}},
 {n:'Roof',d:'thatched niau roof',need:{thatch:5,rope:2}}
];

/* lv = level at which the recipe becomes available */
const RECIPES=[
 {id:'plank',lv:1,n:'Saw planks',in:{log:1},out:{plank:2}},
 {id:'rope',lv:1,n:'Twist nape rope',t:'sennit from coconut husk fibre',in:{coconut:2},out:{rope:1}},
 {id:'thatch',lv:1,n:'Weave a thatch panel',t:'plaited niau fronds',in:{frond:3},out:{thatch:1}},
 {id:'fire',lv:2,n:'Build a fire pit',t:'ahi · cook your food here',in:{stone:4,log:1},place:'fire'},
 {id:'ipu',lv:2,n:'Carve coconut cups',t:'ipu · carry water from the spring',in:{coconut:1},out:{ipu:2}},
 {id:'oo',lv:2,n:'Carve a digging stick',t:'for taro trenches',in:{log:1},out:{oo:1},one:'oo'},
 {id:'canoe',lv:2,n:'Build a vaʻa',t:'outrigger canoe for lagoon fishing',in:{log:3,plank:4,rope:3},place:'canoe'},
 {id:'iaota',lv:2,n:'Make poisson cru',t:'iʻa ota · raw fish in coconut milk',in:{fish:1,coconut:1},out:{iaota:1}},
 {id:'coop',lv:2,n:'Build a chicken coop',t:'a home for a hen',in:{plank:4,rope:2,frond:3},place:'coop'},
 {id:'strips',lv:3,n:'Split bamboo strips',in:{bamboo:1},out:{strips:3}},
 {id:'mat',lv:3,n:'Weave a peue mat',t:'floor mat for your fare',in:{strips:6},furn:'mat'},
 {id:'bed',lv:3,n:'Build a bed',t:'with a red tīfaifai quilt',in:{plank:4,frond:4,rope:1},furn:'bed'},
 {id:'shelf',lv:3,n:'Build a shelf',t:'for your cups and monoʻi',in:{plank:3,rope:1},furn:'shelf'},
 {id:'trap',lv:3,n:'Weave a fish trap',t:'set it in shallow water, it fills by itself',in:{strips:6,rope:2},place:'trap'},
 {id:'oil',lv:4,n:'Press coconut oil',t:'hinu · grated coconut left in the sun',in:{coconut:3},out:{oil:1}},
 {id:'monoi',lv:4,n:'Make monoʻi',t:'tiare flowers steeped in coconut oil',in:{oil:1,tiare:3},out:{monoi:1}},
 {id:'lamp',lv:4,n:'Make an oil lamp',t:'lights your fare at night',in:{ipu:1,oil:1},furn:'lamp'},
 {id:'pen',lv:4,n:'Build an animal pen',t:'pā · for the pig and the goat',in:{log:4,rope:3},place:'pen'},
 {id:'stall',lv:7,n:'Build a fruit stand',t:'visitors buy what you put on it',in:{plank:4,thatch:2,rope:2},place:'stall'},
 {id:'gbed',lv:7,n:'Add a guest bed',t:'one more room at the pension (3 at most)',in:{plank:4,frond:4,rope:1},gbed:true},
 {id:'hei',lv:7,n:'Weave a hei tiare',t:'a flower crown to welcome a guest',in:{tiare:5},out:{hei:1}},
 {id:'iaota2',lv:8,n:'Make poisson cru tahitien',t:'raw fish, lime and coconut milk',in:{fish:1,coconut:1,lime:1},out:{iaota2:1}},
 {id:'vmonoi',lv:6,n:'Make vanilla monoʻi',t:'the finest monoʻi on the motu',in:{monoi:1,vanilla:1},out:{vmonoi:1}}
];
const COOK=[
 {id:'roastfei',lv:1,n:'Roast fei',in:{fei:1},out:{roastfei:1}},
 {id:'grillfish',lv:1,n:'Grill fish',in:{fish:1},out:{grillfish:1}},
 {id:'ctaro',lv:3,n:'Cook taro',t:'in the embers',in:{taro:1},out:{ctaro:1}},
 {id:'ruru',lv:4,n:'Roast ʻuru',t:'breadfruit roasted whole',in:{uru:1},out:{ruru:1}},
 {id:'poe',lv:4,n:'Make poʻe',t:'banana pudding with coconut cream',in:{banana:2,coconut:1},out:{poe:1}},
 {id:'firifiri',lv:7,n:'Fry firi firi',t:'coconut doughnuts, a guest favourite',in:{flour:1,coconut:1},out:{firifiri:2}}
];

/* lv = level from which the animal will let you approach. food: what it accepts. */
const ANIMALS={
 dog:{n:'dog',t:'ʻurī',name:'Mana',lv:2,food:['grillfish','fish','roastfei','ctaro','egg'],need:3,spawn:[14,30],perk:'Follows you and digs up things now and then'},
 chicken:{n:'hen',t:'moa',name:'Moa',lv:2,food:['coconut'],need:2,req:'coop',spawn:[16,-12],perk:'Lays eggs in the coop'},
 cat:{n:'cat',t:'mīmī',name:'Mīmī',lv:3,food:['fish','grillfish'],need:2,spawn:[-10,18],perk:'Keeps rats off: banana bunches give one more'},
 pig:{n:'pig',t:'puaʻa',name:'Pua',lv:4,food:['banana','taro','ctaro','uru','ruru'],need:3,req:'pen',spawn:[-15,-8],perk:'Roots up shoots and coconuts in the pen'},
 goat:{n:'goat',t:'puaʻa niho',name:'Niho',lv:5,food:['frond','banana'],need:3,req:'pen',spawn:[-26,-11],perk:'Gives milk in the pen'}
};

const LEVELS=[
 {n:'Tae mai',d:'Arrival',goals:[
   {t:'Gather 6 coconuts',k:'coconut',need:6},
   {t:'Collect 8 stone',k:'stone',need:8},
   {t:'Build the paepae',house:1,chk:S=>S.stage>=1}],
  text:'You can now build a fire pit, carve coconut cups and a digging stick, build a vaʻa and a chicken coop. The dog on the beach will let you come closer.'},
 {n:'Te fare',d:'Shelter',goals:[
   {t:'Raise the pou and the frame',house:3,chk:S=>S.stage>=3,prog:S=>`${Math.min(Math.max(S.stage-1,0),2)}/2`},
   {t:'Build a fire pit',chk:S=>!!S.fire},
   {t:'Cook something at the fire',k:'cooked',need:1},
   {t:'Tame the dog (feed it 3 times)',chk:S=>S.animals.some(a=>a.type==='dog'&&a.tamed)}],
  reward:{tcut:2},
  text:'Bamboo weaving, furniture and fish traps are now open. Taro can be cooked. The cat is curious about you. Find the spring and the bamboo grove below the mountain.'},
 {n:'Pape',d:'Water',goals:[
   {t:'Finish your fare',house:5,chk:S=>S.stage>=5},
   {t:'Find the spring',chk:S=>!!S.flags.spring},
   {t:'Cut 3 bamboo',k:'bamboo',need:3},
   {t:'Fill a coconut cup with water',k:'water',need:1}],
  text:'Press coconut oil, make monoʻi and an oil lamp, build an animal pen. The pig will let you approach. Dig a taro trench, flood it with water and plant taro.'},
 {n:'Faʻaapu',d:'Garden',goals:[
   {t:'Flood a taro trench',k:'flooded',need:1},
   {t:'Harvest 2 taro',k:'taro',need:2},
   {t:'Catch 5 fish',k:'fish',need:5},
   {t:'Lay a peue mat in your fare',chk:S=>!!S.furn.mat}],
  reward:{usap:1},
  text:'The goat on the mountain will trust you now. You were given an ʻuru shoot: plant your own breadfruit tree.'},
 {n:'Monoʻi',d:'Fragrance',goals:[
   {t:'Make 2 monoʻi',k:'monoi',need:2},
   {t:'Plant the ʻuru',chk:S=>S.crops.some(c=>c.type==='uru'&&!c.wild)},
   {t:'Tame 3 animals',chk:S=>S.animals.filter(a=>a.tamed).length>=3,prog:S=>`${Math.min(3,S.animals.filter(a=>a.tamed).length)}/3`},
   {t:'Sleep a night in your bed',k:'slept',need:1}],
  reward:{vcut:2},
  text:'You were given vanilla cuttings. Vanilla monoʻi is now on the craft list.'},
 {n:'Fetiʻi',d:'Home',goals:[
   {t:'Tame all five animals',chk:S=>S.animals.filter(a=>a.tamed).length>=5,prog:S=>`${S.animals.filter(a=>a.tamed).length}/5`},
   {t:'Furnish the fare: mat, bed, shelf, lamp',chk:S=>['mat','bed','shelf','lamp'].every(k=>S.furn[k]),prog:S=>`${['mat','bed','shelf','lamp'].filter(k=>S.furn[k]).length}/4`},
   {t:'Harvest a vanilla pod',k:'vanilla',need:1},
   {t:'Make vanilla monoʻi',k:'vmonoi',need:1}],
  text:'A spot by the beach is cleared and the poti from Tahiti now stops at a new wharf. Build a guest fare and open your pension de famille. The goélette calls at the wharf every morning.'},
 {n:'Pension',d:'Guesthouse',goals:[
   {t:'Build the guest fare',chk:S=>S.g2>=3,prog:S=>`${Math.min(S.g2,3)}/3`},
   {t:'Build a fruit stand',chk:S=>!!S.stall},
   {t:'Welcome 2 guests',k:'guests',need:2},
   {t:'Earn 3 000 XPF',k:'earned',need:3000}],
  text:'Poisson cru tahitien is on the craft list: buy a lime sapling from the goélette. Guests talk about the pension now, so keep your stars up.'},
 {n:'Manihini',d:'Guests',goals:[
   {t:'Buy 3 things from the goélette',k:'bought',need:3},
   {t:'Host 8 guests',k:'guests',need:8},
   {t:'Reach a 4-star rating',chk:S=>S.pension.ratings.length>=3&&rating(S)>=4,prog:S=>`${rating(S).toFixed(1)}★`},
   {t:'Earn 15 000 XPF in all',k:'earned',need:15000}]}
];

function rating(S){const r=S.pension.ratings;if(!r.length)return 3;return r.reduce((a,b)=>a+b,0)/r.length;}

/* Guest fare (fare manihini) stages */
const GSTAGES=[
 {n:'Paepae',d:'stone base for the guest fare',need:{stone:6}},
 {n:'Bungalow',d:'walls, door and a porch',need:{plank:10,rope:3,log:2}},
 {n:'Roof',d:'niau thatch over room and porch',need:{thatch:5,rope:1}}
];
/* What things fetch at the fruit stand (XPF). Guests tip 1.5× this for a wish. */
const PRICES={coconut:80,banana:100,papaya:250,pineapple:400,lime:60,fei:150,taro:200,uru:200,egg:60,milk:120,fish:250,
  grillfish:300,roastfei:250,ctaro:300,ruru:350,iaota:600,iaota2:800,poe:500,firifiri:200,tiare:50,hei:800,vanilla:1500,monoi:1200,vmonoi:2500};
/* The goélette's hold: things you can't make yourself */
const SHOP=[
 {id:'flour',n:'Bag of flour',t:'3 bags · for firi firi',price:600,give:{flour:3}},
 {id:'pinetop',n:'Pineapple tops',t:'2 tops · plant in the lowlands',price:800,give:{pinetop:2}},
 {id:'papseed',n:'Papaya seeds',t:'2 packets',price:700,give:{papseed:2}},
 {id:'limesap',n:'Lime sapling',t:'limes for poisson cru tahitien',price:1500,give:{limesap:1}},
 {id:'hooks',n:'Steel fish hooks',t:'more fish on every cast',price:2500,once:true},
 {id:'machete',n:'Machete',t:'+1 log per palm, +1 bamboo per cut',price:3000,once:true},
 {id:'motor',n:'Outboard motor',t:'your vaʻa goes much faster',price:8000,once:true},
 {id:'quilt',n:'Tīfaifai for guests',t:'guests rate the pension higher',price:4000,once:true,amen:true},
 {id:'ukulele',n:'Ukulele',t:'music on the porch in the evening',price:3500,once:true,amen:true},
 {id:'hammock',n:'Hammock',t:'strung beside the guest fare',price:2000,once:true,amen:true},
 {id:'kayak',n:'Kayak',t:'guests paddle the lagoon',price:6000,once:true,amen:true},
 {id:'paint',n:'Paint',t:'white walls with turquoise trim',price:2500,once:true,amen:true}
];
const GUEST_NAMES=[['Léa','Paris'],['Kenji','Osaka'],['María','Valparaíso'],['Tom','Auckland'],['Hina','Papeete'],['Sophie','Lyon'],['Jack','San Francisco'],['Mele','Nukuʻalofa'],
  ['Anna','Berlin'],['Lucas','Montréal'],['Aroha','Rotorua'],['Chen','Taipei'],['Isabel','Lisbon'],['Moana','Moorea'],['Noah','Sydney'],['Giulia','Milan'],['Teiva','Raiatea'],['Emma','Brussels']];
const REVIEWS={
 1:['We left hungry.','Nice island, but nobody looked after us.'],
 2:['Beautiful spot, thin welcome.','The room was fine. That is all.'],
 3:['A simple, honest pension.','Good stay. We would come back for the lagoon.'],
 4:['Lovely hosts and real island food.','The poisson cru alone was worth the trip.','We slept to the sound of the reef.'],
 5:['The best stay of our whole trip.','Maeva! We felt like family.','Flowers, food, music. Perfect.']
};
window.FARE_DATA={ICON,WXICON,ITEMS,ORDER,CATS,CROPS,SEEDS,STAGES,RECIPES,COOK,ANIMALS,LEVELS,GSTAGES,PRICES,SHOP,GUEST_NAMES,REVIEWS,rating};
})();

/* Manu's hints: [where Manu flies, what Manu says], one per goal of each level */
(function(){
const H=[
 [['palm','Shake a coconut palm. Coconuts and fronds fall down.'],['rock','The dark basalt rocks break into stone.'],['site','The roped-off spot is your fare site. Bring 8 stone.']],
 [['site','Chop palms for logs, saw them into planks, and twist coconuts into rope.'],['none','Open Craft and build a fire pit wherever you like.'],['mountain','Fei grows on the mountain slopes. Roast it at your fire.'],['dog','The dog on the beach likes fish or cooked food.']],
 [['site','Walls need planks and rope. The roof needs thatch woven from fronds.'],['spring','Follow me! The spring is below the mountain.'],['bamboo','The bamboo grove is near the spring.'],['spring','Carve coconut cups in Craft, then fill them at the spring.']],
 [['trench','Carve a digging stick, dig a trench, then flood it with 2 cups of water.'],['spring','Take a taro top from the wild taro by the spring and plant it in your trench.'],['beach','Build a vaʻa or a fish trap. Fish gather where the water ripples.'],['fare','Split bamboo into strips and weave a peue mat in Craft.']],
 [['none','Plant your tiare cuttings, press coconut oil, then make monoʻi in Craft.'],['none','Plant the ʻuru shoot on open ground. It needs lots of room.'],['animal','Every animal has a favourite food. The hen needs a coop, the pig a pen.'],['fare','Build a bed, then sleep in it after 19:00.']],
 [['animal','The goat lives on the mountain slopes. It likes fronds.'],['fare','Mat, bed, shelf and oil lamp: all in Craft.'],['none','Plant your vanilla cuttings and wait for the pods.'],['none','Mix monoʻi with a vanilla pod in Craft.']],
 [['site2','This spot by the beach is for your guest fare.'],['site2','Build a fruit stand near the pension. It’s in Craft.'],['dock','Guests come on the poti once the guest fare is built and a room is free.'],['site2','Grant your guests’ wishes and keep the fruit stand stocked.']],
 [['dock','The goélette calls at the wharf every morning, 06:00 to 13:00.'],['dock','More rooms bring more guests: add guest beds in Craft.'],['site2','Grant every wish, welcome guests with a hei tiare, and buy comforts.'],['site2','Pineapple, papaya and monoʻi fetch the most at the stand.']]
];
const MANU_COLORS={
 moana:{n:'Moana',body:0x1fa9b0,belly:0xffe2a8,wing:0x137e86},
 ura:{n:'ʻUra',body:0xde4634,belly:0xffd08a,wing:0xa82e22},
 rauoro:{n:'Rauoro',body:0x5aa84a,belly:0xf6e7a2,wing:0x3c7d31},
 popo:{n:'Pōpō',body:0x6b4a8a,belly:0xf2c9e8,wing:0x4a3266},
 teatea:{n:'Teatea',body:0xf3ede0,belly:0xffd36b,wing:0xcfc5ae}
};
const MANU_LINES={
 hello:['Ia ora na! I’m Manu. Tap me whenever you want a hint.'],
 rain:['Ua! The rain is good for your garden.','Rain is coming. Your plants will love it.'],
 storm:['A storm! Stay ashore with me.'],
 night:['The stars are out. Time to rest soon.','Look up: the stars guide the voyagers.'],
 level:['Bravo! A new level!','Maururu! Look what’s new in Craft.'],
 idle:['Have you eaten today?','I love this motu.','Listen to the reef…','Shall we plant something?'],
 done:['Everything is done here. Let’s just enjoy the lagoon.']
};
Object.assign(window.FARE_DATA,{HINTS:H,MANU_COLORS,MANU_LINES});
})();

/* ===== v6: shells, compost, tools, instruments, cloth, open sea ===== */
(function(){
const D=window.FARE_DATA,SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"',sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
const shellRing=(c,shape)=>sv(`<circle cx="12" cy="12" r="7.5" fill="none" stroke="#c9a061" stroke-width="1.6"/>${[0,40,80,120,160,200,240,280,320].map(a=>{const x=(12+7.5*Math.cos(a*Math.PI/180)).toFixed(1),y=(12+7.5*Math.sin(a*Math.PI/180)).toFixed(1);return shape(x,y,c);}).join('')}`);
Object.assign(D.ICON,{
 pupu:sv(`<path d="M5 17c0-6 4-11 10-12-1 3 3 4 4 7 1 4-2 8-7 8-4 0-7-1-7-3Z" fill="#f6efe0" ${SK}/><path d="M9 16c1-3 3-6 6-8M11 18c1-2 3-4 6-5" stroke="#c9b48c" stroke-width="1.2" fill="none"/>`),
 poreho:sv(`<ellipse cx="12" cy="12" rx="6.5" ry="8.5" fill="#b8783e" ${SK}/><g fill="#f3e2c0"><circle cx="9.5" cy="8.5" r="1.1"/><circle cx="14" cy="9.5" r="1"/><circle cx="10.5" cy="13" r="1"/><circle cx="14.5" cy="14.5" r="1.1"/><circle cx="11" cy="17" r=".9"/></g><path d="M12 4.5v15" stroke="#5a3214" stroke-width="1.4"/>`),
 parau:sv(`<path d="M3 13c0-6 4-9 9-9s9 3 9 9c-2 5-6 7-9 7s-7-2-9-7Z" fill="#dfe9ee" ${SK}/><path d="M6 13c1-4 3-6 6-6s5 2 6 6" stroke="#9fc3d6" stroke-width="1.3" fill="none"/><path d="M9 14c1-2 2-3 3-3s2 1 3 3" stroke="#e7b9d6" stroke-width="1.3" fill="none"/>`),
 aute:sv(`<g fill="#e2402e" ${SK}>${[0,72,144,216,288].map(a=>`<ellipse cx="12" cy="6.5" rx="3.6" ry="5" transform="rotate(${a} 12 12)"/>`).join('')}</g><path d="M12 12 17 4" stroke="#f2c94c" stroke-width="1.6"/><circle cx="17" cy="4" r="1.3" fill="#f2c94c"/>`),
 bark:sv(`<path d="M4 6c3-2 13-2 16 0l-1 12c-3 2-11 2-14 0Z" fill="#9a6a38" ${SK}/><path d="M8 7v10M12 6v12M16 7v10" stroke="#6b4422" stroke-width="1.2"/>`),
 ahu:sv(`<path d="M3 6h14a4 4 0 0 1 0 8H7a4 4 0 0 0 0 8H3Z" fill="#f6f1e6" ${SK}/><path d="M17 6a4 4 0 0 1 0 8" fill="#e9dcc0" ${SK}/>`),
 thread:sv(`<path d="M8 4h8M8 20h8" stroke="#14313a" stroke-width="2.2" stroke-linecap="round"/><rect x="9" y="5" width="6" height="14" fill="#de4634" ${SK}/><path d="M9 8h6M9 11h6M9 14h6M9 17h6" stroke="#a82e22" stroke-width="1"/><path d="M15 12c3 0 5 2 5 6" stroke="#de4634" stroke-width="1.4" fill="none"/>`),
 strings:sv(`<circle cx="12" cy="12" r="7" fill="none" stroke="#14313a" stroke-width="3"/><circle cx="12" cy="12" r="7" fill="none" stroke="#e9dcc0" stroke-width="1.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="#e9dcc0" stroke-width="1.2"/>`),
 scraps:sv(`<path d="M3 18c3-3 15-3 18 0l-2 3H5Z" fill="#7a5530" ${SK}/><path d="M6 16c0-4 3-7 5-7-1 3 0 5 1 7Z" fill="#f2c94c" ${SK}/><path d="M12 16c1-3 4-5 7-4-2 1-3 3-3 4Z" fill="#8a5a33" ${SK}/><path d="M9 11 7 6M10 10l2-4" stroke="#5aa84a" stroke-width="1.6" stroke-linecap="round"/>`),
 fert:sv(`<path d="M5 9h14l-1.5 12h-11Z" fill="#6b4a2a" ${SK}/><path d="M5 9c2-2 12-2 14 0" fill="#3d2a1a" ${SK}/><path d="M12 9V3M12 5c-2-2-4-1-5 0 2 1 4 1 5 0Zm0-1c2-2 4-2 5-1-2 1-4 2-5 1Z" stroke="#4c9a44" stroke-width="1.4" fill="#5aa84a"/>`),
 heipupu:shellRing('#f6efe0',(x,y,c)=>`<ellipse cx="${x}" cy="${y}" rx="1.7" ry="2.2" fill="${c}" stroke="#14313a" stroke-width="1"/>`),
 heiporeho:shellRing('#b8783e',(x,y,c)=>`<ellipse cx="${x}" cy="${y}" rx="1.9" ry="2.3" fill="${c}" stroke="#14313a" stroke-width="1"/>`),
 heiparau:sv(`<path d="M4 4c2 7 14 7 16 0" fill="none" stroke="#3d2a1a" stroke-width="1.6"/><path d="M12 11c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5Z" fill="#dfe9ee" ${SK}/><path d="M9.5 16c.5-2 1.5-3 2.5-3s2 1 2.5 3" stroke="#e7b9d6" stroke-width="1.2" fill="none"/>`),
 tapa:sv(`<rect x="3" y="3" width="18" height="18" rx="1" fill="#c79a62" ${SK}/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="#3d2a1a" stroke-width="1.2"/><path d="M5 5l2 2M11 11l2 2M17 17l2 2M17 5l2 2M5 17l2 2" stroke="#3d2a1a" stroke-width="1.4"/>`),
 pareu:sv(`<path d="M3 4h18l-2 16H5Z" fill="#7b4fb0" ${SK}/><g fill="#fbf3e2">${[[8,9],[15,8],[11,15],[17,15]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g><path d="M15 4c0 3 3 3 3 0" stroke="#14313a" stroke-width="1.4" fill="none"/>`),
 tifai:sv(`<rect x="3" y="3" width="18" height="18" rx="1.5" fill="#2fb3b0" ${SK}/><g fill="#fbf3e2">${[0,45,90,135].map(a=>`<ellipse cx="12" cy="12" rx="1.8" ry="6.5" transform="rotate(${a} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="1.8" fill="#2fb3b0"/>`),
 faraoa:sv(`<path d="M3 15c0-6 4-9 9-9s9 3 9 9v3H3Z" fill="#d9a35a" ${SK}/><path d="M7 11c1 1 2 1 3 0M12 9c1 1 2 1 3 0M15 12c1 1 2 1 3 0" stroke="#8a5a1a" stroke-width="1.2" fill="none"/><path d="M3 16h18" stroke="#14313a" stroke-width="1.2"/>`),
 poetaro:sv(`<path d="M2 16c4-8 16-8 20 0-6 4-14 4-20 0Z" fill="#5fa64a" ${SK}/><rect x="7" y="9" width="10" height="6" rx="1.5" fill="#9b7bb8" ${SK}/><path d="M7 11.5h10" stroke="#f3ead2" stroke-width="1.4"/>`),
 aahi:sv(`<path d="M2 12c4-5 11-6 15-2l5-4v12l-5-4c-4 4-11 3-15-2Z" fill="#2c5f8a" ${SK}/><path d="M4 13c4 2 9 2 13-1" stroke="#f2c94c" stroke-width="1.6" fill="none"/><circle cx="6" cy="11" r="1" fill="#fff"/>`),
 mahi:sv(`<path d="M3 11c2-6 9-7 14-4l4-3v14l-4-3c-5 3-12 2-14-4Z" fill="#7cc04e" ${SK}/><path d="M5 13c4 2 9 2 12-1" stroke="#f2c94c" stroke-width="1.6" fill="none"/><path d="M5 7c2-3 8-4 12-2" stroke="#2c7fb8" stroke-width="1.6" fill="none"/><circle cx="6" cy="10" r="1" fill="#14313a"/>`),
 gaahi:sv(`<path d="M2 12c4-5 11-6 15-2l5-4v12l-5-4c-4 4-11 3-15-2Z" fill="#a8683a" ${SK}/><path d="M7 9l3 6M11 8l3 7M15 9l2 5" stroke="#5a3214" stroke-width="1.3"/>`),
 gmahi:sv(`<path d="M3 11c2-6 9-7 14-4l4-3v14l-4-3c-5 3-12 2-14-4Z" fill="#b8863a" ${SK}/><path d="M7 8l3 7M11 7l3 8M15 8l2 6" stroke="#5a3214" stroke-width="1.3"/>`),
 toi:sv(`<path d="M6 21 15 5" stroke="#14313a" stroke-width="3.6" stroke-linecap="round"/><path d="M6 21 15 5" stroke="#8a5a33" stroke-width="2" stroke-linecap="round"/><path d="M12 6 19 3l2 5-6 2Z" fill="#4f4d49" ${SK}/><path d="M13 9l3-4" stroke="#c9a061" stroke-width="1.6"/>`),
 pelle:sv(`<path d="M12 2v12" stroke="#14313a" stroke-width="3.4" stroke-linecap="round"/><path d="M12 2v12" stroke="#a87a4e" stroke-width="1.8"/><path d="M9 3h6" stroke="#14313a" stroke-width="2.4" stroke-linecap="round"/><path d="M8 13h8v4a4 4 0 0 1-8 0Z" fill="#c69a6a" ${SK}/>`),
 ike:sv(`<path d="M4 20 10 14" stroke="#14313a" stroke-width="3.6" stroke-linecap="round"/><path d="M4 20 10 14" stroke="#8a5a33" stroke-width="2" stroke-linecap="round"/><rect x="9" y="4" width="7" height="12" rx="1.5" transform="rotate(45 12.5 10)" fill="#a87a4e" ${SK}/><path d="M11 7l6 6M10 9l5 5" stroke="#6b4422" stroke-width="1"/>`),
 vivo:sv(`<rect x="3" y="10" width="18" height="4.5" rx="2" fill="#b5cf5e" ${SK}/><path d="M9 10v4.5M15 10v4.5" stroke="#14313a" stroke-width="1.2"/><circle cx="6.5" cy="12.25" r=".9" fill="#14313a"/><circle cx="12" cy="12.25" r=".9" fill="#14313a"/><circle cx="18" cy="12.25" r=".9" fill="#14313a"/>`),
 ihara:sv(`<path d="M5 21 9 3h3L8 21Z" fill="#9cbf4a" ${SK}/><path d="M11 21l4-18h3l-4 18Z" fill="#b5cf5e" ${SK}/><path d="M8 9h3M13.5 9h3" stroke="#14313a" stroke-width="1.2"/>`),
 toere:sv(`<rect x="3" y="7" width="18" height="10" rx="5" fill="#8a5a33" ${SK}/><rect x="6" y="11" width="12" height="2" rx="1" fill="#2a1a0e"/><path d="M17 4 21 8M15 3l4 4" stroke="#14313a" stroke-width="1.8" stroke-linecap="round"/>`),
 uke:D.ICON.ukulele,
 compost:sv(`<path d="M4 9h16v11H4Z" fill="#a87a4e" ${SK}/><path d="M4 13h16M4 17h16M9 9v11M15 9v11" stroke="#6b4422" stroke-width="1"/><path d="M4 9c3-3 13-3 16 0" fill="#3d2a1a" ${SK}/><path d="M10 6c0-2 2-3 3-3" stroke="#5aa84a" stroke-width="1.6" fill="none"/>`),
 table:sv(`<rect x="2" y="8" width="20" height="3" rx="1" fill="#bb8b57" ${SK}/><path d="M5 11v9M19 11v9" stroke="#14313a" stroke-width="2.2"/><path d="M8 6c1-2 3-2 4 0M13 6c1-2 3-2 4 0" stroke="#de4634" stroke-width="1.6" fill="none"/>`),
 chairs:sv(`<path d="M5 3v18M5 12h8v9M5 12V3h2" stroke="#14313a" stroke-width="2.4" fill="none" stroke-linejoin="round"/><path d="M5 12h8" stroke="#bb8b57" stroke-width="3"/><path d="M14 8v13M14 14h6v7M14 14V8h1.5" stroke="#14313a" stroke-width="2" fill="none"/>`),
 lash:sv(`<path d="M2 15 12 6l10 9" fill="#d6b062" ${SK}/><path d="M6 12l3 8M12 6v14M18 12l-3 8" stroke="#c9a061" stroke-width="2"/><circle cx="9" cy="20" r="2" fill="#6c6a64" ${SK}/><circle cx="15" cy="20" r="2" fill="#6c6a64" ${SK}/>`),
 sail:sv(`<path d="M12 2v17" stroke="#14313a" stroke-width="2"/><path d="M12 3 4 16h8Z" fill="#d9c27a" ${SK}/><path d="M6 13h6M8 9.5h4" stroke="#a8893f" stroke-width="1"/><path d="M2 18h20c-2 3-6 4-10 4S4 21 2 18Z" fill="#7a4a28" ${SK}/>`),
 ptable:null,
 note:sv(`<path d="M9 18V6l10-2v12" stroke="#14313a" stroke-width="2" fill="none"/><ellipse cx="7" cy="18" rx="3" ry="2.3" fill="#de4634" ${SK}/><ellipse cx="17" cy="16" rx="3" ry="2.3" fill="#de4634" ${SK}/>`),
 honu:sv(`<ellipse cx="12" cy="13" rx="6.5" ry="7.5" fill="#6b7a3a" ${SK}/><path d="M12 6v14M7 10h10M7 16h10" stroke="#3d4a1e" stroke-width="1.1"/><circle cx="12" cy="4" r="2.4" fill="#9aa86a" ${SK}/><path d="M5 9 2 7M19 9l3-2M6 18l-3 2M18 18l3 2" stroke="#14313a" stroke-width="2.4" stroke-linecap="round"/>`),
 repair:sv(`<path d="M2 14 12 5l10 9" fill="#d6b062" ${SK}/><path d="M9 9h6v6H9Z" fill="#3d2a1a"/><path d="M14 20 20 14" stroke="#14313a" stroke-width="3" stroke-linecap="round"/><path d="M18 12l4 4-2 2-4-4Z" fill="#6c6a64" ${SK}/>`),
 decor:sv(`<rect x="3" y="3" width="18" height="15" rx="1.5" fill="#c79a62" ${SK}/><path d="M7 7l3 3-3 3M17 7l-3 3 3 3" stroke="#3d2a1a" stroke-width="1.5" fill="none"/><path d="M2 21h20" stroke="#14313a" stroke-width="2"/>`)
});
D.ICON.ptable=D.ICON.table;
Object.assign(D.WXICON,{
 wind:`<svg viewBox="0 0 28 28"><path d="M3 10h14a3.5 3.5 0 1 0-3.5-3.5M3 15h19a3.5 3.5 0 1 1-3.5 3.5M3 20h9" stroke="#14313a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M20 5l4 1-2 3" stroke="#5aa84a" stroke-width="1.6" fill="#7cc04e"/></svg>`,
 tornado:`<svg viewBox="0 0 28 28"><path d="M3 4h22M5 8h18M8 12h12M10 16h8M12 20h5M13 24h3" stroke="#14313a" stroke-width="2.4" stroke-linecap="round"/><path d="M3 4h22M5 8h18M8 12h12" stroke="#9aa4a7" stroke-width="1" stroke-linecap="round"/></svg>`
});
D.CATS.splice(3,0,['craft','Handicrafts'],['music','Instruments']);
const NEW={
 pupu:{n:'Pūpū',t:'small white shell',cat:'mat'},poreho:{n:'Pōreho',t:'cowrie shell',cat:'mat'},parau:{n:'Pārau',t:'mother-of-pearl shell · rare',cat:'mat'},
 aute:{n:'ʻAute flower',t:'hibiscus · a dye for pāreu',cat:'mat'},bark:{n:'ʻUru bark',t:'beat it into tapa',cat:'mat'},
 ahu:{n:'Cotton fabric',t:'from the goélette',cat:'mat'},thread:{n:'Thread',t:'for sewing tīfaifai',cat:'mat'},strings:{n:'Ukulele strings',cat:'mat'},
 scraps:{n:'Scraps',t:'peels, husks and bones · for the compost',cat:'mat'},fert:{n:'Compost',t:'engrais · use it on a plant',cat:'mat'},
 heipupu:{n:'Hei pūpū',t:'shell necklace · tap to wear',cat:'craft',wear:true},heiporeho:{n:'Hei pōreho',t:'cowrie necklace · tap to wear',cat:'craft',wear:true},
 heiparau:{n:'Pārau pendant',t:'mother of pearl · tap to wear',cat:'craft',wear:true},
 tapa:{n:'Tapa',t:'beaten bark cloth',cat:'craft'},pareu:{n:'Pāreu',t:'hand-dyed · tap to wear',cat:'craft',wear:true},tifai:{n:'Tīfaifai',t:'patchwork quilt',cat:'craft'},
 faraoa:{n:'Coconut bread',t:'faraoa haʻari',food:30,cat:'food'},poetaro:{n:'Poʻe taro',t:'taro pudding with coconut cream',food:45,cat:'food'},
 aahi:{n:'Aʻahi',t:'yellowfin tuna',food:20,cat:'food'},mahi:{n:'Mahi mahi',food:18,cat:'food'},
 gaahi:{n:'Grilled aʻahi',food:50,cat:'food'},gmahi:{n:'Grilled mahi mahi',food:45,cat:'food'},
 toi:{n:'Toʻi',t:'stone adze · +1 log per palm, needed for carving',cat:'tool'},
 pelle:{n:'Wooden spade',t:'pelle · digs trenches, new plants start stronger, compost turns faster',cat:'tool'},
 ike:{n:'Iʻe',t:'tapa beater',cat:'tool'},
 vivo:{n:'Vivo',t:'nose flute · tap to play',cat:'music',play:true},ihara:{n:'ʻIhara',t:'bamboo clapper · tap to play',cat:'music',play:true},
 toere:{n:'Toʻere',t:'slit drum · tap to play',cat:'music',play:true},uke:{n:'Ukulele',t:'tap to play',cat:'music',play:true}
};
Object.assign(D.ITEMS,NEW);D.ORDER.push(...Object.keys(NEW));
D.RECIPES.push(
 {id:'toi',lv:1,n:'Make a toʻi',t:'stone adze · more logs, and you need it for carving',in:{stone:2,log:1,rope:1},out:{toi:1},one:'toi'},
 {id:'pelle',lv:2,n:'Carve a wooden spade',t:'pelle · dig trenches, give new plants a head start',in:{plank:2,log:1,rope:1},out:{pelle:1},one:'pelle'},
 {id:'compost',lv:2,n:'Build a compost bin',t:'turns kitchen scraps into compost (engrais)',in:{plank:3,rope:1},place:'compost'},
 {id:'heipupu',lv:2,n:'String a hei pūpū',t:'shell necklace',in:{pupu:10,rope:1},out:{heipupu:1}},
 {id:'heiporeho',lv:3,n:'String a hei pōreho',t:'cowrie necklace',in:{poreho:5,pupu:5,rope:1},out:{heiporeho:1}},
 {id:'table',lv:3,n:'Build a table',t:'meals at the table fill you up more',in:{plank:4,log:1},furn:'table',done:'Your table is in the fare.'},
 {id:'chairs',lv:3,n:'Build two chairs',t:'parahiraʻa',in:{plank:3,rope:1},furn:'chairs',done:'Two chairs are in your fare.'},
 {id:'lash',lv:3,n:'Lash the roofs down',t:'ropes and stone weights · storms do less damage',in:{rope:6,stone:6},special:'lash'},
 {id:'vivo',lv:3,n:'Make a vivo',t:'nose flute from a bamboo cane',in:{bamboo:1},out:{vivo:1},one:'vivo'},
 {id:'ihara',lv:3,n:'Make an ʻihara',t:'split-bamboo clapper',in:{bamboo:2},out:{ihara:1},one:'ihara'},
 {id:'toere',lv:3,n:'Carve a toʻere',t:'slit drum · needs a toʻi',in:{log:2},out:{toere:1},one:'toere',tool:'toi'},
 {id:'heiparau',lv:4,n:'Carve a pārau pendant',t:'mother of pearl on a cord',in:{parau:2,rope:1},out:{heiparau:1}},
 {id:'ike',lv:5,n:'Carve an iʻe',t:'tapa beater · needs a toʻi',in:{log:1},out:{ike:1},one:'ike',tool:'toi'},
 {id:'tapa',lv:5,n:'Beat a tapa',t:'ʻuru bark beaten flat · needs an iʻe',in:{bark:3},out:{tapa:1},tool:'ike'},
 {id:'pareu',lv:7,n:'Dye a pāreu',t:'cotton dyed with ʻaute flowers',in:{ahu:1,aute:4},out:{pareu:1}},
 {id:'tifai',lv:7,n:'Sew a tīfaifai',t:'a patchwork quilt',in:{ahu:3,thread:1},out:{tifai:1}},
 {id:'uke',lv:7,n:'Build an ukulele',t:'needs a toʻi · also plays on the guest porch',in:{plank:2,strings:1},out:{uke:1},one:'uke',tool:'toi'},
 {id:'ptable',lv:7,n:'Porch table for guests',t:'table and chairs on the guest porch',in:{plank:6,rope:2},special:'ptable'},
 {id:'sail',lv:10,n:'Give your vaʻa a sail',t:'woven sail · cross the reef pass to the open sea',in:{strips:10,rope:4,plank:4},special:'sail'}
);
D.COOK.push(
 {id:'poetaro',lv:4,n:'Make poʻe taro',t:'taro and coconut cream',in:{taro:1,coconut:1},out:{poetaro:1}},
 {id:'faraoa',lv:7,n:'Bake coconut bread',t:'faraoa haʻari',in:{flour:1,coconut:2},out:{faraoa:2}},
 {id:'gaahi',lv:10,n:'Grill aʻahi',in:{aahi:1},out:{gaahi:1}},
 {id:'gmahi',lv:10,n:'Grill mahi mahi',in:{mahi:1},out:{gmahi:1}}
);
for(let i=D.SHOP.length-1;i>=0;i--)if(D.SHOP[i].id==='ukulele'||D.SHOP[i].id==='quilt')D.SHOP.splice(i,1);
D.SHOP.splice(4,0,
 {id:'ahu',n:'Cotton fabric',t:'3 lengths · for pāreu and tīfaifai',price:1200,give:{ahu:3}},
 {id:'thread',n:'Thread and needle',t:'2 spools · for tīfaifai',price:500,give:{thread:2}},
 {id:'strings',n:'Ukulele strings',t:'a set of 4',price:800,give:{strings:1}});
Object.assign(D.PRICES,{pupu:30,poreho:90,parau:350,heipupu:900,heiporeho:1800,heiparau:2800,tapa:2200,pareu:1800,tifai:6500,faraoa:300,poetaro:450,
  aahi:900,mahi:800,gaahi:1100,gmahi:1000,aute:40,fert:150,bark:150});
D.LEVELS[7].text='The goélette now carries cotton fabric, thread and ukulele strings. Make pāreu and tīfaifai, beat ʻuru bark into tapa, and decorate your fare.';
D.LEVELS.push(
 {n:'Ahu',d:'Cloth and shells',goals:[
   {t:'Make a shell necklace',k:'shellhei',need:1},
   {t:'Beat a tapa',k:'tapa',need:1},
   {t:'Dye a pāreu',k:'pareu',need:1},
   {t:'Decorate your fares (2 pieces)',chk:S=>Object.values(S.decor||{}).filter(Boolean).length>=2,prog:S=>`${Math.min(2,Object.values(S.decor||{}).filter(Boolean).length)}/2`}],
  text:'Weave a sail for your vaʻa. Then sail out through the pass in the reef, between the red and green posts near the wharf, into the open sea.'},
 {n:'Moana nui',d:'Open sea',goals:[
   {t:'Give your vaʻa a sail',chk:S=>!!S.sail},
   {t:'Catch a fish in the open sea',k:'deepfish',need:1},
   {t:'Play music for 3 guests',k:'musicguest',need:3},
   {t:'Watch a honu',k:'honu',need:1}]}
);
D.HINTS.push(
 [['shells','Pick up shells on the beach. String pūpū into a necklace in Craft.'],['uru','Strip bark from an ʻuru tree, carve an iʻe, then beat the bark into tapa.'],['bush','Pick ʻaute flowers from the hibiscus bushes and dye cotton fabric from the goélette.'],['fare','Step into your fare and tap Decorate to hang a tapa, a pāreu or a tīfaifai.']],
 [['dock','Weave a sail in Craft. The pass in the reef is by the wharf, between the red and green posts.'],['sea','Out at sea, look for seabirds diving. Tuna feed under them.'],['site2','Make an instrument, then play it from your bag near your guests.'],['lagoon','Honu swim in the lagoon and sometimes rest on the beach. Watch them quietly.']]
);
Object.assign(D.MANU_LINES,{
 shoot:['A shooting star! Make a wish.','Did you see that? A shooting star!'],
 honu:['Look, a honu! They are protected. We only watch them.'],
 tornado:['A puahiohio! A little tornado! Stay away from it!'],
 damage:['The storm damaged the roof. We need thatch to repair it.'],
 music:['♪ I love this song!','♪ Again, again!'],
 wind:['Hold on to your hat! The wind is up.'],
 dolphin:['Dolphins! They love to race the vaʻa.'],
 sea:['The open sea! Watch for diving birds.']
});
})();

/* ===== v7: ahimaʻa, excursions, phone, newspaper, store, craft categories ===== */
(function(){
const D=window.FARE_DATA,SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"',sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
Object.assign(D.ICON,{
 ahimaa:sv(`<path d="M2 18c2-6 18-6 20 0Z" fill="#5a8a3a" ${SK}/><path d="M5 17c2-3 12-3 14 0" stroke="#3c6a2a" stroke-width="1.2" fill="none"/><g fill="#6c6a64" ${SK}><circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/><circle cx="12" cy="20" r="2"/></g><path d="M9 9c0-2 2-2 2-4M14 9c0-2 2-2 2-4" stroke="#9aa4a7" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),
 maa:sv(`<path d="M2 14c4-6 16-6 20 0-5 4-15 4-20 0Z" fill="#5fa64a" ${SK}/><circle cx="8" cy="12" r="2.4" fill="#b4461a" ${SK}/><rect x="11" y="9.5" width="4" height="4" rx="1" fill="#cbb7d8" ${SK}/><path d="M16 12c1-2 3-2 4 0Z" fill="#b8763a" ${SK}/><circle cx="12" cy="7" r="1.6" fill="#ffffff" ${SK}/>`),
 phone:sv(`<rect x="7" y="2" width="10" height="20" rx="2.5" fill="#2c4a6a" ${SK}/><rect x="8.6" y="4.6" width="6.8" height="12.6" rx="1" fill="#5cc3e0"/><circle cx="12" cy="19.4" r="1" fill="#e9dcc0"/><path d="M10 9l2-2 2 2M12 7v6" stroke="#fff" stroke-width="1.2" fill="none"/>`),
 paper:sv(`<path d="M3 5h15v14a2 2 0 0 0 2 2H5a2 2 0 0 1-2-2Z" fill="#f6f1e6" ${SK}/><path d="M18 9h3v10a2 2 0 0 1-4 0" fill="#e9dcc0" ${SK}/><rect x="5.5" y="7.5" width="6" height="5" fill="#de4634"/><path d="M13.5 8h3M13.5 11h3M5.5 15h10M5.5 18h10" stroke="#14313a" stroke-width="1.3"/>`),
 store:sv(`<path d="M2 10 5 4h14l3 6Z" fill="#de4634" ${SK}/><path d="M2 10h20" stroke="#14313a" stroke-width="1.4"/><path d="M5.5 4 4.5 10M9 4l-.5 6M12 4v6M15 4l.5 6M18.5 4l1 6" stroke="#fbf3e2" stroke-width="1.4"/><rect x="4" y="10" width="16" height="10" fill="#f6f1e6" ${SK}/><rect x="10" y="13" width="4" height="7" fill="#bb8b57" ${SK}/>`),
 rice:sv(`<path d="M6 6h12l1 15H5Z" fill="#f6f1e6" ${SK}/><path d="M6 6c2-3 10-3 12 0" fill="#e9dcc0" ${SK}/><path d="M8 12h8M8 15h8" stroke="#de4634" stroke-width="1.6"/>`),
 sugar:sv(`<rect x="5" y="5" width="14" height="15" rx="1.5" fill="#2fb3b0" ${SK}/><rect x="7.5" y="9" width="9" height="6" rx="1" fill="#fbf3e2"/><path d="M9 12h6" stroke="#14313a" stroke-width="1.4"/>`),
 coffee:sv(`<path d="M5 7h12v9a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5Z" fill="#7a4a28" ${SK}/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" stroke="#14313a" stroke-width="1.6" fill="none"/><path d="M9 5c0-2 2-2 2-4M13 5c0-2 2-2 2-4" stroke="#9aa4a7" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
 whale:sv(`<path d="M2 13c3-5 11-6 16-3l3-3v8l-3-2c-5 4-13 4-16 0Z" fill="#34404a" ${SK}/><path d="M4 15c4 2 9 2 13 0" stroke="#d9e2e6" stroke-width="1.6" fill="none"/><path d="M9 7c0-2 1-3 2-4M11 7c1-2 2-2 3-2" stroke="#5cc3e0" stroke-width="1.4" fill="none" stroke-linecap="round"/>`),
 trip:sv(`<circle cx="9" cy="7" r="3" fill="#c98a5a" ${SK}/><path d="M4 21c0-5 2-8 5-8s5 3 5 8Z" fill="#f2c94c" ${SK}/><path d="M15 21l3-12 3 12" fill="none" stroke="#14313a" stroke-width="1.6"/><path d="M18 9l3-3" stroke="#de4634" stroke-width="2" stroke-linecap="round"/>`)
});
const NEW={
 maa:{n:'Māʻa Tahiti',t:'feast from the ahimaʻa · guests love it',food:90,cat:'food'},
 paper:{n:'Te Parau ʻĀpī',t:'today’s newspaper · tap to read',cat:'tool',read:true},
 rice:{n:'Rice',t:'shop goods · sell it in your store',cat:'goods'},sugar:{n:'Sugar',t:'shop goods',cat:'goods'},coffee:{n:'Coffee',t:'shop goods',cat:'goods'}
};
Object.assign(D.ITEMS,NEW);D.ORDER.push(...Object.keys(NEW));
D.CATS.push(['goods','Shop goods']);
D.RECIPES.push(
 {id:'ahimaa',lv:4,n:'Dig an ahimaʻa',t:'earth oven of hot stones · cook a feast for many',in:{stone:8,log:3,frond:4},place:'ahimaa'},
 {id:'store',lv:12,n:'Build a fare toa',t:'a little grocery store by the wharf',in:{plank:12,thatch:6,rope:4,stone:6},place:'store'}
);
const CAT_OF={plank:'mat',rope:'mat',thatch:'mat',strips:'mat',oil:'mat',
 toi:'tools',pelle:'tools',oo:'tools',ike:'tools',ipu:'tools',
 fire:'build',canoe:'build',sail:'build',coop:'build',pen:'build',compost:'build',trap:'build',lash:'build',ahimaa:'build',stall:'build',gbed:'build',ptable:'build',store:'build',
 mat:'home',bed:'home',shelf:'home',lamp:'home',table:'home',chairs:'home',
 iaota:'food',iaota2:'food',
 heipupu:'crafts',heiporeho:'crafts',heiparau:'crafts',hei:'crafts',tapa:'crafts',pareu:'crafts',tifai:'crafts',monoi:'crafts',vmonoi:'crafts',
 vivo:'music',ihara:'music',toere:'music',uke:'music'};
D.RECIPES.forEach(r=>{r.cat=CAT_OF[r.id]||'mat';});
D.CRAFT_CATS=[['mat','Materials','plank'],['tools','Tools','toi'],['build','Building','thatch'],['home','Home','bed'],['food','Food','iaota'],['crafts','Crafts','heipupu'],['music','Music','uke']];
D.SHOP.push(
 {id:'phone',n:'Telephone',t:'order from the goélette any time, weather, call for guests',price:12000,once:true},
 {id:'rice',n:'Rice for your store',t:'3 bags · each sells for 300 XPF',price:600,give:{rice:3}},
 {id:'sugar',n:'Sugar for your store',t:'3 packets · each sells for 220 XPF',price:420,give:{sugar:3}},
 {id:'coffee',n:'Coffee for your store',t:'2 bags · each sells for 650 XPF',price:900,give:{coffee:2}}
);
D.ICON.phone=D.ICON.phone;
Object.assign(D.PRICES,{maa:2500,rice:300,sugar:220,coffee:650});
D.LEVELS[9].text='Your guests now ask for excursions: honu, the waterfall, sunsets, your animals, dolphins, whales and the stars. Each one pays well. The goélette also sells a telephone.';
D.LEVELS.push(
 {n:'Ratere',d:'Excursions',goals:[
   {t:'Lead 3 excursions',k:'excursions',need:3},
   {t:'Show a tourist the whales',k:'ex_whale',need:1},
   {t:'Explain the stars to a tourist',k:'ex_stars',need:1},
   {t:'Cook a feast in the ahimaʻa',k:'feast',need:1}],
  text:'The newspaper Te Parau ʻĀpī now comes on the poti every morning. You can build a fare toa, a little grocery store, by the wharf.'},
 {n:'Fare toa',d:'The store',goals:[
   {t:'Buy a telephone',chk:S=>!!(S.owned&&S.owned.phone)},
   {t:'Read the newspaper',k:'paper',need:1},
   {t:'Build the fare toa',chk:S=>!!S.store},
   {t:'Earn 40 000 XPF in all',k:'earned',need:40000}]}
);
D.HINTS.push(
 [['site2','Talk to a guest at the pension. Many of them would love an excursion.'],['sea','Take a guest in your vaʻa through the pass. The whales (tohorā) swim far out at sea.'],['site2','At night, take a guest who asked for the stars outside, then tap “Explain the stars”.'],['none','Dig an ahimaʻa (Craft · Building), fill it with fei, taro, ʻuru or fish, and cover it. 4 or more foods make a feast.']],
 [['dock','The telephone is on the goélette, in the morning.'],['none','The newspaper arrives in your bag every morning. Tap it to read.'],['dock','Build the fare toa near the wharf (Craft · Building).'],['dock','Stock your store with produce, crafts and shop goods from the goélette.']]
);
Object.assign(D.MANU_LINES,{
 whale:['Tohorā! Humpback whales come to our waters from July to November.'],
 excursion:['Your guest loved it! Maururu!','What a beautiful excursion!'],
 stars:['Look up. The stars are the voyagers’ map.']
});
D.EXCURSIONS={
 honu:{n:'See a honu',t:'Take {n} to see a honu, in the lagoon or resting on the beach.',pay:2500,where:'lagoon'},
 spring:{n:'Visit the waterfall',t:'Take {n} to the spring and its little waterfall.',pay:1500,where:'spring'},
 sunset:{n:'Watch the sunset',t:'Watch the sunset with {n} on the beach, around 18:00.',pay:2000,where:'shells'},
 animals:{n:'Meet your animals',t:'Introduce {n} to two of your animals.',pay:2000,where:'animal'},
 dolphin:{n:'See the dolphins',t:'Take {n} in your vaʻa through the pass to see the dolphins.',pay:4000,where:'sea'},
 whale:{n:'See the whales',t:'Sail with {n} out to sea to see the tohorā (humpback whales).',pay:6000,where:'whale'},
 stars:{n:'Learn the stars',t:'After 19:00, take {n} outside and tap “Explain the stars”.',pay:3500,where:'none'}
};
D.STARS=[
 {k:'matarii',n:'Matariʻi',t:'The Pleiades',x:'When Matariʻi rises at dusk, around 20 November (Matariʻi i niʻa), the season of abundance begins. When it can no longer be seen at dusk, around May (Matariʻi i raro), the season of scarcity begins.'},
 {k:'matau',n:'Te Matau a Māui',t:'Scorpius',x:'The fishhook of Māui. In the legend, Māui used this hook to pull islands up from the bottom of the ocean.'},
 {k:'cross',n:'The Southern Cross',t:'Crux',x:'Its long arm points toward the south. Voyagers watched it to keep their course at night.'},
 {k:'compass',n:'The star compass',t:'How voyagers navigate',x:'Each star always rises and sets at the same point on the horizon. Navigators learned these points by heart and steered toward them, like a compass made of stars.'}
];
D.NEWS=[
 'Record catch: a fisherman in Tahiti brings in a 60 kg aʻahi.',
 'Heiva dancers rehearse every evening for the July festival.',
 'A pod of dolphins seen playing near the reef pass.',
 'The goélette will carry extra cotton fabric this week.',
 'Vanilla growers expect a fine harvest this season.',
 'Schoolchildren plant 200 coconut palms along the beach.',
 'Humpback whales spotted off the coast: a mother and her calf.',
 'Tīfaifai exhibition opens in Papeete. Quilters from every island take part.',
 'Va’a race this weekend: crews train at dawn in the lagoon.',
 'Weather office reminds islanders to lash their roofs before storm season.'
];
})();

/* ===== v8: flying with Manu, vaʻa taurua, lagoon tours ===== */
(function(){
const D=window.FARE_DATA,SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"',sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
Object.assign(D.ICON,{
 fly:sv(`<path d="M2 14c4-1 7-4 9-9 1 4 0 8-3 11 4-1 8-1 12 2-5 2-10 2-14 1-2 0-3-2-4-5Z" fill="#1fa9b0" ${SK}/><path d="M7 15c3-1 5-3 6-6" stroke="#137e86" stroke-width="1.2" fill="none"/>`),
 taurua:sv(`<path d="M2 15h9c-1 3-3 4-5 4s-3-1-4-4ZM13 15h9c-1 3-3 4-5 4s-3-1-4-4Z" fill="#7a4a28" ${SK}/><rect x="3" y="12.5" width="18" height="2" rx=".8" fill="#bb8b57" ${SK}/><path d="M12 2v10" stroke="#14313a" stroke-width="1.8"/><path d="M12 3 5 11h7Z" fill="#d9c27a" ${SK}/>`),
 ring:sv(`<circle cx="12" cy="12" r="7.5" fill="none" stroke="#14313a" stroke-width="4"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#ffc83d" stroke-width="2.2"/>`),
 tour:sv(`<path d="M3 14h18c-2 4-5 6-9 6s-7-2-9-6Z" fill="#7a4a28" ${SK}/><g fill="#c98a5a" ${SK}><circle cx="8" cy="9" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="16" cy="9" r="2"/></g><path d="M5 14v-2h14v2" stroke="#14313a" stroke-width="1.4" fill="none"/>`)
});
D.RECIPES.push({id:'taurua',lv:13,n:'Build a vaʻa taurua',t:'double canoe with a deck · carries 4 passengers on lagoon tours',in:{log:6,plank:10,rope:8,strips:6},special:'taurua',cat:'build'});
D.LEVELS[3].text+=' Manu can now take you flying! Tap the wing button at the top.';
D.LEVELS[11].text='Turn your vaʻa into a vaʻa taurua, a double canoe that carries passengers on lagoon tours. And Manu’s viewpoints are waiting in the sky.';
D.LEVELS.push({n:'Rere',d:'Sky and sea',goals:[
  {t:'Fly through 4 of Manu’s viewpoints',k:'skyrings',need:4},
  {t:'Build the vaʻa taurua',chk:S=>!!S.taurua},
  {t:'Give 2 lagoon tours',k:'tours',need:2},
  {t:'Carry 8 passengers',k:'passengers',need:8}]});
D.HINTS.push([['none','Tap the wing button and fly with Manu. Golden rings mark the viewpoints: the summit, the waterfall, the pass, the wharf, your fare, whale waters.'],['none','Build the vaʻa taurua in Craft · Building. You need a vaʻa with a sail first.'],['dock','Paddle the vaʻa taurua to the wharf and start a lagoon tour.'],['dock','Each tour takes 2 to 4 passengers. Visit every stop, then come back to the wharf.']]);
Object.assign(D.MANU_LINES,{fly:['Hold on, we’re flying!','Look how small the fare is from up here!'],tired:['I’m tired… let me rest on the ground.','My wings need a rest!']});
})();

/* ===== v9: fields, ʻumara and manioc, taupoʻo, pearl farm, honey, port, helipad, dispensary ===== */
(function(){
const D=window.FARE_DATA,SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"',sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
const pearl=(c,h)=>sv(`<circle cx="12" cy="12" r="7.5" fill="${c}" ${SK}/><circle cx="9.4" cy="9.2" r="2.2" fill="${h}" opacity=".8"/>`);
Object.assign(D.ICON,{
 kumara:sv(`<path d="M3 13c1-5 7-7 12-6s7 4 6 7-6 5-11 4-8-2-7-5Z" fill="#a8456a" ${SK}/><path d="M8 11c1 1 3 1 4 0M13 15c1 0 2 0 3-1" stroke="#7a2e4c" stroke-width="1.2" fill="none"/><path d="M20 10l2-2" stroke="#14313a" stroke-width="1.6"/>`),
 manioc:sv(`<path d="M4 18 17 5c2-1 3 0 2 2L6 20c-2 1-3 0-2-2Z" fill="#8a5a33" ${SK}/><path d="M7 15l2 2M10 12l2 2M13 9l2 2" stroke="#5e3b1d" stroke-width="1.2"/><ellipse cx="18" cy="6" rx="1.4" ry="1" fill="#f6efd8"/>`),
 kumaraslip:sv(`<path d="M12 21V11" stroke="#3f7d34" stroke-width="2"/><path d="M12 13c-4 0-7-2-7-6 4 0 7 2 7 6ZM12 11c3-1 6-4 6-7-4 1-6 4-6 7Z" fill="#5fa64a" ${SK}/><path d="M9 21h6" stroke="#14313a" stroke-width="1.6"/>`),
 maniocstem:sv(`<path d="M8 21 15 4" stroke="#14313a" stroke-width="4" stroke-linecap="round"/><path d="M8 21 15 4" stroke="#b08a5a" stroke-width="2.2" stroke-linecap="round"/><path d="M10 15l2 1M12 10l2 1" stroke="#14313a" stroke-width="1.2"/>`),
 rkumara:sv(`<path d="M3 13c1-5 7-7 12-6s7 4 6 7-6 5-11 4-8-2-7-5Z" fill="#5a2a1a" ${SK}/><path d="M7 12c3-2 8-2 11 0-3 2-8 2-11 0Z" fill="#f2a33a" ${SK}/>`),
 cmanioc:sv(`<ellipse cx="12" cy="17" rx="9" ry="4" fill="#e9dcc0" ${SK}/><path d="M6 14c1-4 4-5 6-5s5 1 6 5" fill="#f6efd8" ${SK}/><path d="M9 12h6" stroke="#c9b48a" stroke-width="1.2"/>`),
 poemanioc:sv(`<rect x="3" y="9" width="18" height="10" rx="3" fill="#f2d98a" ${SK}/><path d="M3 12h18" stroke="#14313a" stroke-width="1.2"/><path d="M6 15h4M13 15h5" stroke="#d6b062" stroke-width="1.4"/><path d="M3 9c3-3 15-3 18 0" fill="#5fa64a" ${SK}/>`),
 taupoo:sv(`<ellipse cx="12" cy="15" rx="10" ry="3.6" fill="#e3c27a" ${SK}/><path d="M7 14c0-5 2-8 5-8s5 3 5 8" fill="#d6b062" ${SK}/><path d="M7 12.6h10" stroke="#de4634" stroke-width="1.8"/><path d="M5 15h14M9 9l1 5M14 9l-1 5" stroke="#a37d34" stroke-width="1"/>`),
 ecrin:sv(`<path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" fill="#7a2e3c" ${SK}/><path d="M4 11l2-6h12l2 6Z" fill="#9a3e4c" ${SK}/><ellipse cx="12" cy="11" rx="6" ry="1.6" fill="#f6efd8"/><circle cx="12" cy="10.6" r="1.8" fill="#3a4a4a" ${SK}/>`),
 nucleus:sv(`<circle cx="8" cy="10" r="3.4" fill="#f6efd8" ${SK}/><circle cx="16" cy="9" r="3" fill="#f6efd8" ${SK}/><circle cx="12" cy="16" r="3.4" fill="#f6efd8" ${SK}/>`),
 meli:sv(`<path d="M7 7h10v11a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3Z" fill="#f2a33a" ${SK}/><rect x="6" y="4" width="12" height="3.4" rx="1" fill="#de4634" ${SK}/><path d="M9 12h6M9 15h6" stroke="#c97d1c" stroke-width="1.3"/>`),
 bees:sv(`<ellipse cx="12" cy="13" rx="6" ry="4.5" fill="#f2c94c" ${SK}/><path d="M10 9v8M14 9v8" stroke="#14313a" stroke-width="1.8"/><ellipse cx="9" cy="7" rx="3" ry="2" fill="#e6f4f8" ${SK}/><ellipse cx="15" cy="7" rx="3" ry="2" fill="#e6f4f8" ${SK}/>`),
 hive:sv(`<rect x="4" y="8" width="16" height="12" rx="1" fill="#e3b77c" ${SK}/><path d="M3 8h18l-2-3H5Z" fill="#a8743f" ${SK}/><path d="M4 12h16M4 16h16" stroke="#a8743f" stroke-width="1.2"/><rect x="10" y="17" width="4" height="1.6" fill="#14313a"/>`),
 ponton:sv(`<rect x="2" y="12" width="20" height="4" rx="1" fill="#c38c51" ${SK}/><path d="M6 12V6h12v6" fill="none" stroke="#14313a" stroke-width="1.6"/><path d="M4 6h16l-2-3H6Z" fill="#d6b062" ${SK}/><path d="M2 19c2-1 4-1 6 0s4 1 6 0 4-1 6 0" stroke="#2fb3b0" stroke-width="1.8" fill="none"/>`),
 pfarm:sv(`<path d="M6 10h8v5H6Z" fill="#c38c51" ${SK}/><path d="M5 10l5-4 5 4Z" fill="#d6b062" ${SK}/><path d="M7 15v5M13 15v5" stroke="#14313a" stroke-width="1.6"/><path d="M15 17h7" stroke="#14313a" stroke-width="1.2"/><circle cx="17" cy="17" r="1.4" fill="#2a2a2a"/><circle cx="20.5" cy="17" r="1.4" fill="#2a2a2a"/><path d="M2 20c3-1 6-1 9 0s6 1 11 0" stroke="#2fb3b0" stroke-width="1.6" fill="none"/>`),
 pearl:pearl('#3a4a4a','#9ad0c8'),
 pearlA:pearl('#2e4a46','#bfe8e0'),
 till:sv(`<path d="M2 18c3-3 6-3 9 0s6 3 11 0" fill="#7a4a28" ${SK}/><path d="M2 14c3-3 6-3 9 0s6 3 11 0" fill="none" stroke="#5e3b1d" stroke-width="1.6"/><path d="M14 3l4 9" stroke="#14313a" stroke-width="2"/><path d="M16 11l4-1 1 3-4 1Z" fill="#9aa4a7" ${SK}/>`),
 port:sv(`<rect x="2" y="13" width="20" height="5" fill="#9aa4a7" ${SK}/><rect x="4" y="8" width="6" height="5" fill="#de4634" ${SK}/><rect x="11" y="9" width="6" height="4" fill="#2c7fb8" ${SK}/><path d="M18 13V3l-6 3" stroke="#14313a" stroke-width="1.6" fill="none"/><path d="M2 21c3-1 6-1 9 0s6 1 11 0" stroke="#2fb3b0" stroke-width="1.6" fill="none"/>`),
 helipad:sv(`<circle cx="12" cy="12" r="9" fill="#9aa4a7" ${SK}/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#fbf3e2" stroke-width="1.4"/><path d="M9 8v8M15 8v8M9 12h6" stroke="#fbf3e2" stroke-width="2"/>`),
 heli:sv(`<path d="M4 13c0-3 3-5 7-5h3c3 0 5 2 5 5s-2 4-5 4h-5c-3 0-5-1-5-4Z" fill="#de4634" ${SK}/><path d="M14 9h4l2 3h-6Z" fill="#9ad0e8" ${SK}/><path d="M2 6h20M12 6v2M2 13H0M8 17l-1 2h10l-1-2" stroke="#14313a" stroke-width="1.6"/>`),
 disp:sv(`<path d="M3 10 12 4l9 6v10H3Z" fill="#fbf3e2" ${SK}/><rect x="9" y="9" width="6" height="6" rx="1" fill="#2fa36b"/><path d="M12 10v4M10 12h4" stroke="#fff" stroke-width="1.8"/><rect x="10.5" y="16" width="3" height="4" fill="#7a4a28"/>`),
 cargo:sv(`<rect x="3" y="8" width="18" height="11" rx="1" fill="#de4634" ${SK}/><path d="M7 8v11M11 8v11M15 8v11M19 8v11" stroke="#a8301f" stroke-width="1.2"/><path d="M8 4h8v4H8Z" fill="#9aa4a7" ${SK}/>`)
});
const NEW={
 kumara:{n:'ʻUmara',t:'sweet potato · cook it first',cat:'food'},
 manioc:{n:'Manioc',t:'maniota · cook it first',cat:'food'},
 kumaraslip:{n:'ʻUmara slip',t:'plant it in a tilled bed',cat:'plant'},
 maniocstem:{n:'Manioc stem',t:'plant it in a tilled bed',cat:'plant'},
 rkumara:{n:'Roasted ʻumara',t:'sweet and filling',food:40,cat:'food'},
 cmanioc:{n:'Boiled manioc',t:'with a little salt',food:38,cat:'food'},
 poemanioc:{n:'Poʻe maniota',t:'manioc pudding with coconut cream',food:65,cat:'food'},
 meli:{n:'Meli (honey)',t:'a jar of island honey',food:20,cat:'food'},
 taupoo:{n:'Taupoʻo',t:'woven hat · tap to wear',cat:'craft',wear:true},
 ecrin:{n:'Écrin',t:'jewel box · keeps 6 pearls',cat:'tool'},
 nucleus:{n:'Nucleus beads',t:'for grafting pearl oysters',cat:'tool'},
 bees:{n:'Bee colony',t:'for a beehive',cat:'tool'}
};
Object.assign(D.ITEMS,NEW);D.ORDER.push(...Object.keys(NEW));
D.CROPS2={
 kumara:{n:'ʻumara',grow:100,yield:{kumara:3,kumaraslip:1},slip:'kumaraslip',verb:'Dig up ʻumara'},
 manioc:{n:'manioc',grow:140,yield:{manioc:2,maniocstem:1},slip:'maniocstem',verb:'Pull up manioc'}
};
D.COOK.push(
 {id:'rkumara',lv:14,n:'Roast ʻumara',t:'in the embers',in:{kumara:1},out:{rkumara:1}},
 {id:'cmanioc',lv:14,n:'Boil manioc',in:{manioc:1,water:1},out:{cmanioc:1}},
 {id:'poemanioc',lv:14,n:'Make poʻe maniota',t:'grated manioc, coconut cream, a little honey if you have it',in:{manioc:2,coconut:1},out:{poemanioc:1}}
);
D.RECIPES.push(
 {id:'taupoo',lv:14,n:'Weave a taupoʻo',t:'a Polynesian hat of plaited niau',in:{frond:4,strips:3},out:{taupoo:1},cat:'crafts'},
 {id:'ponton',lv:15,n:'Build the ponton',t:'a floating pontoon for visitors at the end of the wharf · tours carry 4 and pay more',in:{plank:12,log:4,rope:6,thatch:3},special:'ponton',cat:'build'},
 {id:'pfarm',lv:15,n:'Build a pearl farm',t:'a fare on stilts in the lagoon with oyster lines',in:{log:6,plank:8,rope:10,thatch:4},special:'pfarm',cat:'build'},
 {id:'ecrin',lv:15,n:'Make an écrin',t:'a jewel box lined with tapa · keeps 6 pearls',in:{plank:1,tapa:1},out:{ecrin:1},cat:'crafts'},
 {id:'hive',lv:16,n:'Build a beehive',t:'place it near flowers: tiare, hibiscus, vanilla, palms',in:{plank:4,bees:1},place:'hive',cat:'build'},
 {id:'port',lv:17,n:'Build the small port',t:'a stone quay with a crane · the goélette unloads more, for less',in:{stone:20,log:6,plank:10,rope:6},special:'port',cat:'build'},
 {id:'helipad',lv:17,n:'Build a helipad',t:'scenic flights for guests · more guests arrive',in:{stone:14,plank:6},place:'helipad',cat:'build'},
 {id:'disp',lv:17,n:'Build a dispensary',t:'a nurse cares for small injuries · coral cuts, sunburn, urchin spines',in:{plank:14,thatch:6,stone:8,rope:4},place:'disp',cat:'build'}
);
D.SHOP.push(
 {id:'kumaraslip',n:'ʻUmara slips',t:'3 slips · plant in a tilled bed',price:600,give:{kumaraslip:3}},
 {id:'maniocstem',n:'Manioc stems',t:'3 stems · plant in a tilled bed',price:600,give:{maniocstem:3}},
 {id:'nucleus',n:'Nucleus beads',t:'3 beads · graft 3 pearl oysters',price:1500,give:{nucleus:3}},
 {id:'bees',n:'Bee colony',t:'for a new beehive',price:3000,give:{bees:1}}
);
Object.assign(D.PRICES,{kumara:180,manioc:160,rkumara:320,cmanioc:300,poemanioc:700,meli:1200,taupoo:1800});
D.PEARL={
 grades:{A:{n:'A · top grade',v:9000,w:0.1},B:{n:'B',v:5000,w:0.25},C:{n:'C',v:2500,w:0.38},D:{n:'D',v:1000,w:0.27}},
 colors:{paon:{n:'Peacock',c:'#2e4a46',h:'#b9e6c9',m:1.4},aubergine:{n:'Aubergine',c:'#4a2e46',h:'#e2b6e0',m:1.2},vert:{n:'Pistachio green',c:'#4a5a34',h:'#e6f0b0',m:1.1},gris:{n:'Silver grey',c:'#6c7478',h:'#f0f4f6',m:1},noir:{n:'Black',c:'#22282c',h:'#8fa6b6',m:1.15},or:{n:'Gold',c:'#8a6a2c',h:'#ffe6a8',m:1.3}},
 jewels:{collier:{n:'Pearl necklace',need:5,rope:1,mult:1.6},bracelet:{n:'Pearl bracelet',need:3,rope:1,mult:1.5},pendant:{n:'Pearl pendant',need:1,rope:1,mult:1.4}},
 growDays:1.5
};
D.LEVELS[12].text='The fields wait: till the soil with your spade and plant ʻumara and manioc. Weave a taupoʻo to keep the sun off.';
D.LEVELS[12].reward={kumaraslip:2,maniocstem:2};
D.LEVELS.push(
 {n:'Faʻaapu rahi',d:'The big garden',goals:[
   {t:'Till 3 garden beds',k:'tilled',need:3},
   {t:'Harvest 6 ʻumara',k:'kumara',need:6},
   {t:'Harvest 4 manioc',k:'manioc',need:4},
   {t:'Weave a taupoʻo',k:'taupoo',need:1}],
  text:'A pearl farmer from Takaroa visits and shows you how to graft oysters. Build a pearl farm in the lagoon and a ponton for your visitors. The pearls grow very slowly.',reward:{nucleus:3}},
 {n:'Poe rava',d:'Black pearls',goals:[
   {t:'Build the ponton',chk:S=>!!S.ponton},
   {t:'Build the pearl farm',chk:S=>!!S.pfarm},
   {t:'Graft 6 oysters',k:'grafted',need:6},
   {t:'Harvest 3 pearls',k:'pearls',need:3}],
  text:'A beekeeper gives you a bee colony. Build a beehive near flowers. Turn your pearls into necklaces and bracelets.',reward:{bees:1}},
 {n:'Meli',d:'Honey and pearls',goals:[
   {t:'Build a beehive',chk:S=>!!S.hive},
   {t:'Harvest 3 jars of honey',k:'honey',need:3},
   {t:'Make a pearl necklace',k:'j_collier',need:1},
   {t:'Make a pearl bracelet',k:'j_bracelet',need:1}],
  text:'Your island is growing. Build a small port for the goélette, a helipad for scenic flights, and a dispensary for your guests.'},
 {n:'Ora',d:'Island services',goals:[
   {t:'Build the small port',chk:S=>!!S.port},
   {t:'Build a helipad',chk:S=>!!S.helipad},
   {t:'Give a scenic helicopter flight',k:'heliflights',need:1},
   {t:'Build the dispensary',chk:S=>!!S.disp}]}
);
D.HINTS.push(
 [['none','Stand on open ground with your spade or digging stick and tap “Till a garden bed”.'],['none','Plant an ʻumara slip in a tilled bed. Water it to help it grow.'],['none','Plant a manioc stem in another bed. Manioc takes longer.'],['none','Weave a taupoʻo in Craft · Crafts: 4 fronds and 3 bamboo strips.']],
 [['dock','Build the ponton in Craft · Building. You need your vaʻa taurua.'],['none','Build the pearl farm in Craft · Building. It stands in the lagoon.'],['sea','Paddle to the pearl farm and graft oysters with nucleus beads. More beads on the goélette.'],['sea','Pearls take about a day and a half. Clean the oysters to get better pearls. Make an écrin to keep them.']],
 [['none','Build a beehive near flowers: tiare, hibiscus, vanilla, palms.'],['none','Bees make honey faster with more flowers nearby. Come back to harvest.'],['none','Open your écrins (the pearl button at the top) and pick 5 pearls for a necklace.'],['none','A bracelet takes 3 pearls and 1 rope.']],
 [['dock','Build the small port in Craft · Building. It goes beside the wharf.'],['none','Build a helipad on flat open ground.'],['none','Go to the helipad when a guest is staying, in the daytime.'],['none','Build the dispensary on flat ground near the pension.']]
);
Object.assign(D.MANU_LINES,{pearl:['A pearl! Each one is different.','Look at that orient!'],bees:['Bzzz! The bees love your flowers.'],heli:['Look, the helicopter! Your guest will see the whole island.']});
})();

/* ===== v10: street lamps (oil, solar, generator), new flowers and trees ===== */
(function(){
const D=window.FARE_DATA,SK='stroke="#14313a" stroke-width="1.6" stroke-linejoin="round"',sv=b=>`<svg viewBox="0 0 24 24" aria-hidden="true">${b}</svg>`;
const flower=(c,mid)=>sv(`<g fill="${c}" ${SK}>${[0,72,144,216,288].map(a=>`<ellipse cx="12" cy="6.8" rx="3" ry="4.6" transform="rotate(${a} 12 12)"/>`).join('')}</g><circle cx="12" cy="12" r="2.2" fill="${mid}" ${SK}/>`);
const cutting=(leaf,fl)=>sv(`<path d="M7 21 16 6" stroke="#14313a" stroke-width="3.4" stroke-linecap="round"/><path d="M7 21 16 6" stroke="#8a5a33" stroke-width="1.8" stroke-linecap="round"/><path d="M13 11c-3-1-5-3-5-6 3 0 5 2 5 6Z" fill="${leaf}" ${SK}/><circle cx="17" cy="5" r="2.6" fill="${fl}" ${SK}/>`);
const seedling=(leaf)=>sv(`<path d="M5 17h14l-2 5H7Z" fill="#a8743f" ${SK}/><path d="M12 17V9" stroke="#3f7d34" stroke-width="2"/><path d="M12 11c-4 0-6-2-6-5 4 0 6 2 6 5ZM12 10c3-1 6-3 6-6-4 0-6 3-6 6Z" fill="${leaf}" ${SK}/>`);
Object.assign(D.ICON,{
 bougain:flower('#d6359a','#fbf3e2'),taina:flower('#fbf8f0','#f2c94c'),pua:flower('#f6e3a0','#e0a030'),
 bcut:cutting('#4f9a3a','#d6359a'),taicut:cutting('#2e6a2e','#fbf8f0'),puacut:cutting('#4f9a3a','#f6e3a0'),
 nonoseed:seedling('#3f8a34'),tamanuseed:seedling('#2e6a2e'),santseed:seedling('#6a9a4a'),mapeseed:seedling('#4f9a3a'),
 nono:sv(`<ellipse cx="12" cy="13" rx="6" ry="8" fill="#e9e6b8" ${SK}/>${[[10,9],[14,10],[11,14],[14,15],[12,18]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.1" fill="#a9a66a"/>`).join('')}<path d="M12 5V2" stroke="#14313a" stroke-width="1.6"/>`),
 tamanu:sv(`<circle cx="12" cy="13" r="7.5" fill="#7fae4a" ${SK}/><circle cx="9.6" cy="10.6" r="2" fill="#b8d88a" opacity=".8"/><path d="M12 5.5V2" stroke="#14313a" stroke-width="1.6"/>`),
 santal:sv(`<rect x="3" y="9" width="18" height="6" rx="2" fill="#c9a06a" ${SK}/><path d="M6 12h4M12 11h6M8 14h8" stroke="#a37d4a" stroke-width="1.1"/><path d="M15 6c1-2 3-2 4-4M10 6c0-2 1-3 2-4" stroke="#9aa4a7" stroke-width="1.2" fill="none"/>`),
 mape:sv(`<path d="M4 14c0-5 4-9 9-9 5 0 7 4 7 7 0 5-5 8-9 8-4 0-7-2-7-6Z" fill="#b48a4a" ${SK}/><path d="M8 12c2-3 6-4 9-2" stroke="#7a5a2a" stroke-width="1.3" fill="none"/>`),
 rmape:sv(`<path d="M4 14c0-5 4-9 9-9 5 0 7 4 7 7 0 5-5 8-9 8-4 0-7-2-7-6Z" fill="#6a3a1a" ${SK}/><path d="M7 13c2-3 7-4 10-1-2 3-7 4-10 1Z" fill="#f2d98a" ${SK}/>`),
 heipua:sv(`<circle cx="12" cy="12" r="7.5" fill="none" stroke="#3f7d34" stroke-width="2"/>${[0,45,90,135,180,225,270,315].map((a,i)=>{const x=12+Math.cos(a*Math.PI/180)*7.5,y=12+Math.sin(a*Math.PI/180)*7.5;return`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${['#d6359a','#fbf8f0','#f6e3a0','#de4634'][i%4]}" ${SK}/>`;}).join('')}`),
 smonoi:sv(`<path d="M9 3h6v3l2 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3Z" fill="#f6efd8" ${SK}/><path d="M7.8 12h8.4v8a1.4 1.4 0 0 1-1.4 1.4H9.2A1.4 1.4 0 0 1 7.8 20Z" fill="#d9a86a"/><rect x="9" y="13" width="6" height="2.4" fill="#7a4a28"/>`),
 tamanuoil:sv(`<path d="M9 3h6v3l2 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3Z" fill="#f6efd8" ${SK}/><path d="M7.8 12h8.4v8a1.4 1.4 0 0 1-1.4 1.4H9.2A1.4 1.4 0 0 1 7.8 20Z" fill="#4f8a3a"/><circle cx="12" cy="15.5" r="1.8" fill="#b8d88a"/>`),
 nonojuice:sv(`<path d="M8 4h8l1 17H7Z" fill="#f6efd8" ${SK}/><path d="M7.6 11h8.8l.6 10H7Z" fill="#c9a84a"/><rect x="9" y="2" width="6" height="2.4" fill="#de4634" ${SK}/>`),
 parterre:sv(`<ellipse cx="12" cy="16" rx="10" ry="4.5" fill="#7a4a28" ${SK}/>${[[6,14,'#d6359a'],[10,12,'#fbf8f0'],[14,12,'#f6e3a0'],[18,14,'#de4634'],[12,16,'#d6359a']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="2.3" fill="${c}" ${SK}/>`).join('')}`),
 lamp:sv(`<path d="M12 22V9" stroke="#14313a" stroke-width="2.4"/><path d="M8 9h8l-1-5H9Z" fill="#ffd27a" ${SK}/><path d="M7 4h10" stroke="#14313a" stroke-width="2"/><path d="M8 22h8" stroke="#14313a" stroke-width="2"/>`),
 solar:sv(`<path d="M3 15 7 6h14l-4 9Z" fill="#2c4a6a" ${SK}/><path d="M5 10.5h14M10 6l-3 9M14.5 6l-3 9" stroke="#5cc3e0" stroke-width="1"/><path d="M12 15v6M8 21h8" stroke="#14313a" stroke-width="1.8"/>`),
 bulb:sv(`<path d="M12 3a6 6 0 0 1 4 10.5V16H8v-2.5A6 6 0 0 1 12 3Z" fill="#fff3b0" ${SK}/><rect x="8.5" y="16" width="7" height="4" rx="1" fill="#9aa4a7" ${SK}/>`),
 generator:sv(`<rect x="3" y="8" width="18" height="11" rx="2" fill="#f2c94c" ${SK}/><rect x="6" y="11" width="8" height="5" rx="1" fill="#14313a"/><circle cx="17.5" cy="13.5" r="2" fill="#de4634" ${SK}/><path d="M6 8V5h5v3" fill="none" stroke="#14313a" stroke-width="1.6"/>`),
 gen:sv(`<rect x="3" y="8" width="18" height="11" rx="2" fill="#f2c94c" ${SK}/><rect x="6" y="11" width="8" height="5" rx="1" fill="#14313a"/><circle cx="17.5" cy="13.5" r="2" fill="#de4634" ${SK}/>`),
 fuel:sv(`<path d="M6 6h9l4 4v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" fill="#de4634" ${SK}/><path d="M8 3h5v3H8Z" fill="#9aa4a7" ${SK}/><path d="M8 11l7 7M15 11l-7 7" stroke="#a8301f" stroke-width="1.6"/>`)
});
const NEW={
 bougain:{n:'Bougainvillea',t:'bright bracts · for hei and lamp shades',cat:'mat'},taina:{n:'Tiare taina',t:'gardenia · very fragrant',cat:'mat'},pua:{n:'Pua flower',t:'creamy and fragrant',cat:'mat'},
 bcut:{n:'Bougainvillea cutting',cat:'plant'},taicut:{n:'Tiare taina cutting',cat:'plant'},puacut:{n:'Pua cutting',cat:'plant'},
 nonoseed:{n:'Nono seedling',cat:'plant'},tamanuseed:{n:'Tamanu seedling',cat:'plant'},santseed:{n:'Sandalwood seedling',t:'ʻahi',cat:'plant'},mapeseed:{n:'Mape seedling',t:'Tahitian chestnut',cat:'plant'},
 nono:{n:'Nono fruit',t:'noni · for juice and yellow dye',cat:'mat'},tamanu:{n:'Tamanu nut',t:'pressed for tamanu oil',cat:'mat'},santal:{n:'Sandalwood',t:'ʻahi · fragrant wood',cat:'mat'},
 mape:{n:'Mape',t:'Tahitian chestnut · roast it first',cat:'food'},rmape:{n:'Roasted mape',t:'warm and nutty',food:30,cat:'food'},
 heipua:{n:'Hei pua',t:'flower necklace · tap to wear',cat:'craft',wear:true},smonoi:{n:'Monoʻi ʻahi',t:'sandalwood monoʻi · tap to use',cat:'craft',use:true},
 tamanuoil:{n:'Tamanu oil',t:'traditional skin oil · sells well',cat:'goods'},nonojuice:{n:'Nono juice',t:'sells to visitors',cat:'goods'},
 solar:{n:'Solar lamp kit',t:'panel and battery for one street lamp',cat:'tool'},bulb:{n:'Light bulb',t:'for an electric street lamp',cat:'tool'},
 generator:{n:'Groupe électrogène',t:'install it, then fill it with fuel',cat:'tool'},fuel:{n:'Jerrycan of fuel',t:'one night for the generator',cat:'tool'}
};
Object.assign(D.ITEMS,NEW);D.ORDER.push(...Object.keys(NEW));
Object.assign(D.CROPS,{
 bougain:{n:'bougainvillea',grow:70,regrow:40,yield:{bougain:3},shoot:'bcut',shootCd:120,place:'low',verb:'Pick bracts',cutting:true,flowers:1},
 taina:{n:'tiare taina',grow:75,regrow:45,yield:{taina:3},shoot:'taicut',shootCd:120,place:'low',verb:'Pick flowers',cutting:true,flowers:1},
 pua:{n:'pua',grow:90,regrow:50,yield:{pua:3},shoot:'puacut',shootCd:140,place:'low',verb:'Pick flowers',cutting:true,flowers:1},
 nono:{n:'nono',grow:100,regrow:60,yield:{nono:2},shoot:'nonoseed',shootCd:200,place:'low',verb:'Pick nono',flowers:0.6},
 tamanu:{n:'tamanu',grow:150,regrow:70,yield:{tamanu:4},shoot:'tamanuseed',shootCd:240,place:'low',verb:'Gather tamanu nuts',big:true,flowers:0.8},
 santal:{n:'sandalwood',grow:140,regrow:120,yield:{santal:1},shoot:'santseed',shootCd:240,place:'low',verb:'Trim sandalwood',flowers:0.5},
 mape:{n:'mape',grow:160,regrow:70,yield:{mape:3},shoot:'mapeseed',shootCd:240,place:'low',verb:'Gather mape',big:true,flowers:0.5}
});
Object.assign(D.SEEDS,{bcut:'bougain',taicut:'taina',puacut:'pua',nonoseed:'nono',tamanuseed:'tamanu',santseed:'santal',mapeseed:'mape'});
D.COOK.push({id:'rmape',lv:1,n:'Roast mape',t:'Tahitian chestnuts in the embers',in:{mape:2},out:{rmape:1}});
D.RECIPES.push(
 {id:'heipua',lv:3,n:'Weave a hei pua',t:'necklace of bougainvillea, taina and pua',in:{bougain:2,taina:2,pua:2},out:{heipua:1},cat:'crafts'},
 {id:'smonoi',lv:4,n:'Make monoʻi ʻahi',t:'coconut oil steeped with sandalwood',in:{oil:1,santal:1},out:{smonoi:1},cat:'crafts'},
 {id:'tamanuoil',lv:4,n:'Press tamanu oil',t:'dried tamanu nuts, pressed slowly',in:{tamanu:4},out:{tamanuoil:1},cat:'crafts'},
 {id:'nonojuice',lv:7,n:'Make nono juice',in:{nono:3,water:1},out:{nonojuice:1},cat:'food'},
 {id:'parterre',lv:5,n:'Plant a flower bed',t:'stone-edged garden bed · guests love it',in:{stone:6,bougain:2,taina:2,tiare:2},place:'parterre',cat:'home'},
 {id:'lamp',lv:5,n:'Build a street lamp',t:'lampadaire · burns coconut oil at night',in:{log:1,plank:1,stone:2,oil:1},place:'lamp',cat:'build'},
 {id:'gen',lv:18,n:'Install the groupe électrogène',t:'powers electric street lamps · needs fuel',in:{generator:1,plank:2,stone:2},place:'gen',cat:'build'}
);
D.SHOP.push(
 {id:'solar',n:'Solar lamp kit',t:'turns one street lamp solar · no fuel',price:6000,give:{solar:1}},
 {id:'bulb',n:'Light bulbs',t:'2 bulbs for electric street lamps',price:600,give:{bulb:2}},
 {id:'generator',n:'Groupe électrogène',t:'a generator for electric lamps',price:15000,give:{generator:1}},
 {id:'fuel',n:'Fuel',t:'2 jerrycans · one night each',price:1200,give:{fuel:2}},
 {id:'bcut',n:'Bougainvillea cuttings',t:'2 cuttings',price:900,give:{bcut:2}},
 {id:'taicut',n:'Tiare taina cuttings',t:'2 cuttings',price:1100,give:{taicut:2}}
);
Object.assign(D.PRICES,{bougain:60,taina:80,pua:80,nono:120,tamanu:90,santal:900,mape:150,rmape:300,heipua:1400,smonoi:2800,tamanuoil:2200,nonojuice:800});
D.LAMPCOL={warm:{n:'Warm',c:'#ffcf73',cost:null},red:{n:'Red',c:'#ff4a3a',cost:{aute:2,strips:1},t:'ʻaute dye'},pink:{n:'Pink',c:'#ff58c0',cost:{bougain:2,strips:1},t:'bougainvillea'},
 yellow:{n:'Yellow',c:'#ffe23a',cost:{nono:1,strips:1},t:'nono root dye'},green:{n:'Green',c:'#7cff6a',cost:{frond:2,strips:1},t:'green niau shade'},
 blue:{n:'Lagoon blue',c:'#4ad8ff',cost:{parau:1,strips:1},t:'mother-of-pearl shade'},white:{n:'Moonlight',c:'#e8f0ff',cost:{tiare:2,strips:1},t:'tiare-white shade'}};
D.MILESTONES=[
 {k:'m_bougain',t:'Plant 10 plants',chk:S=>(S.planted||0)>=10,give:{bcut:2},from:'Your neighbour Mere'},
 {k:'m_taina',t:'Tame 3 animals',chk:S=>S.animals.filter(a=>a.tamed).length>=3,give:{taicut:2},from:'An old lady from the village'},
 {k:'m_pua',t:'Welcome 5 guests',chk:S=>(S.stats.guests||0)>=5,give:{puacut:2},from:'A happy guest'},
 {k:'m_nono',t:'Cook 10 meals',chk:S=>(S.stats.cooked||0)>=10,give:{nonoseed:1},from:'The fisherman next door'},
 {k:'m_santal',t:'Make 3 monoʻi',chk:S=>(S.stats.monoi||0)>=3,give:{santseed:1},from:'A monoʻi maker from Raiatea'},
 {k:'m_tamanu',t:'Reach level 10',chk:S=>S.level>=10,give:{tamanuseed:1},from:'The goélette captain'},
 {k:'m_mape',t:'Earn 20 000 XPF',chk:S=>(S.stats.earned||0)>=20000,give:{mapeseed:1},from:'The mayor'}
];
D.LEVELS[16].text='Night falls on a lively island. Light your paths with street lamps, and power them with the sun or a groupe électrogène.';
D.LEVELS[16].reward={solar:1,bulb:2};
D.LEVELS.push(
 {n:'Mōrī',d:'Lights in the night',goals:[
   {t:'Build 3 street lamps',chk:S=>(S.lamps||[]).length>=3},
   {t:'Change a lamp’s colour',k:'lampcol',need:1},
   {t:'Light a lamp with the sun',k:'solarlamp',need:1},
   {t:'Run the generator for a night',k:'gennight',need:1}],
  text:'Make a flower garden: plant the new flowers and trees, weave a hei pua, and plant flower beds.'},
 {n:'ʻŌtiʻa tiare',d:'The flower garden',goals:[
   {t:'Grow 4 kinds of new flowers or trees',prog:S=>`${v10Kinds(S)}/4`,chk:S=>v10Kinds(S)>=4},
   {t:'Weave a hei pua',k:'heipua',need:1},
   {t:'Plant 2 flower beds',chk:S=>(S.parterres||[]).length>=2},
   {t:'Make tamanu oil or monoʻi ʻahi',chk:S=>((S.stats.tamanuoil||0)+(S.stats.smonoi||0))>=1}]}
);
function v10Kinds(S){const K=['bougain','taina','pua','nono','tamanu','santal','mape'];return K.filter(k=>S.crops.some(c=>c.type===k&&c.g>=1)).length;}
D.HINTS.push(
 [['none','Build street lamps in Craft · Building: a log, a plank, 2 stones and coconut oil.'],['none','Walk up to a lamp and tap “Change colour”. ʻAute, bougainvillea or nono make coloured shades.'],['none','Fit the solar kit to a lamp. It charges in the sunshine and lights up at night.'],['dock','Buy a groupe électrogène and fuel on the goélette. Install it, fill the tank, and wire a lamp with a bulb.']],
 [['none','New plants come as gifts when you reach milestones, and the goélette sells cuttings. Plant them and let them grow.'],['none','A hei pua needs 2 bougainvillea, 2 taina and 2 pua flowers.'],['none','Flower beds are in Craft · Home.'],['none','Press tamanu oil from 4 nuts, or make monoʻi ʻahi with oil and sandalwood.']]
);
Object.assign(D.MANU_LINES,{gift:['A gift for your garden!','Someone noticed your hard work!'],lamps:['The lamps are lovely tonight.']});
})();
