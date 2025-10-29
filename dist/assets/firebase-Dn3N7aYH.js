const Yy=()=>{};var Wh={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qf=function(r){const e=[];let t=0;for(let n=0;n<r.length;n++){let i=r.charCodeAt(n);i<128?e[t++]=i:i<2048?(e[t++]=i>>6|192,e[t++]=i&63|128):(i&64512)===55296&&n+1<r.length&&(r.charCodeAt(n+1)&64512)===56320?(i=65536+((i&1023)<<10)+(r.charCodeAt(++n)&1023),e[t++]=i>>18|240,e[t++]=i>>12&63|128,e[t++]=i>>6&63|128,e[t++]=i&63|128):(e[t++]=i>>12|224,e[t++]=i>>6&63|128,e[t++]=i&63|128)}return e},Xy=function(r){const e=[];let t=0,n=0;for(;t<r.length;){const i=r[t++];if(i<128)e[n++]=String.fromCharCode(i);else if(i>191&&i<224){const s=r[t++];e[n++]=String.fromCharCode((i&31)<<6|s&63)}else if(i>239&&i<365){const s=r[t++],o=r[t++],c=r[t++],u=((i&7)<<18|(s&63)<<12|(o&63)<<6|c&63)-65536;e[n++]=String.fromCharCode(55296+(u>>10)),e[n++]=String.fromCharCode(56320+(u&1023))}else{const s=r[t++],o=r[t++];e[n++]=String.fromCharCode((i&15)<<12|(s&63)<<6|o&63)}}return e.join("")},Jf={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(r,e){if(!Array.isArray(r))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,n=[];for(let i=0;i<r.length;i+=3){const s=r[i],o=i+1<r.length,c=o?r[i+1]:0,u=i+2<r.length,l=u?r[i+2]:0,f=s>>2,p=(s&3)<<4|c>>4;let g=(c&15)<<2|l>>6,v=l&63;u||(v=64,o||(g=64)),n.push(t[f],t[p],t[g],t[v])}return n.join("")},encodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(r):this.encodeByteArray(Qf(r),e)},decodeString(r,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(r):Xy(this.decodeStringToByteArray(r,e))},decodeStringToByteArray(r,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,n=[];for(let i=0;i<r.length;){const s=t[r.charAt(i++)],c=i<r.length?t[r.charAt(i)]:0;++i;const l=i<r.length?t[r.charAt(i)]:64;++i;const p=i<r.length?t[r.charAt(i)]:64;if(++i,s==null||c==null||l==null||p==null)throw new Zy;const g=s<<2|c>>4;if(n.push(g),l!==64){const v=c<<4&240|l>>2;if(n.push(v),p!==64){const D=l<<6&192|p;n.push(D)}}}return n},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let r=0;r<this.ENCODED_VALS.length;r++)this.byteToCharMap_[r]=this.ENCODED_VALS.charAt(r),this.charToByteMap_[this.byteToCharMap_[r]]=r,this.byteToCharMapWebSafe_[r]=this.ENCODED_VALS_WEBSAFE.charAt(r),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[r]]=r,r>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(r)]=r,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(r)]=r)}}};class Zy extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const eI=function(r){const e=Qf(r);return Jf.encodeByteArray(e,!0)},Vo=function(r){return eI(r).replace(/\./g,"")},fu=function(r){try{return Jf.decodeString(r,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yf(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tI=()=>Yf().__FIREBASE_DEFAULTS__,nI=()=>{if(typeof process>"u"||typeof Wh>"u")return;const r=Wh.__FIREBASE_DEFAULTS__;if(r)return JSON.parse(r)},rI=()=>{if(typeof document>"u")return;let r;try{r=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=r&&fu(r[1]);return e&&JSON.parse(e)},ta=()=>{try{return Yy()||tI()||nI()||rI()}catch(r){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${r}`);return}},Xf=r=>ta()?.emulatorHosts?.[r],iI=r=>{const e=Xf(r);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const n=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),n]:[e.substring(0,t),n]},pu=()=>ta()?.config,Zf=r=>ta()?.[`_${r}`];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sI{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,n)=>{t?this.reject(t):this.resolve(n),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,n))}}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sr(r){try{return(r.startsWith("http://")||r.startsWith("https://")?new URL(r).hostname:r).endsWith(".cloudworkstations.dev")}catch{return!1}}async function mu(r){return(await fetch(r,{credentials:"include"})).ok}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oI(r,e){if(r.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},n=e||"demo-project",i=r.iat||0,s=r.sub||r.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${n}`,aud:n,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}},...r};return[Vo(JSON.stringify(t)),Vo(JSON.stringify(o)),""].join(".")}const Hi={};function aI(){const r={prod:[],emulator:[]};for(const e of Object.keys(Hi))Hi[e]?r.emulator.push(e):r.prod.push(e);return r}function cI(r){let e=document.getElementById(r),t=!1;return e||(e=document.createElement("div"),e.setAttribute("id",r),t=!0),{created:t,element:e}}let Hh=!1;function ep(r,e){if(typeof window>"u"||typeof document>"u"||!sr(window.location.host)||Hi[r]===e||Hi[r]||Hh)return;Hi[r]=e;function t(g){return`__firebase__banner__${g}`}const n="__firebase__banner",s=aI().prod.length>0;function o(){const g=document.getElementById(n);g&&g.remove()}function c(g){g.style.display="flex",g.style.background="#7faaf0",g.style.position="fixed",g.style.bottom="5px",g.style.left="5px",g.style.padding=".5em",g.style.borderRadius="5px",g.style.alignItems="center"}function u(g,v){g.setAttribute("width","24"),g.setAttribute("id",v),g.setAttribute("height","24"),g.setAttribute("viewBox","0 0 24 24"),g.setAttribute("fill","none"),g.style.marginLeft="-6px"}function l(){const g=document.createElement("span");return g.style.cursor="pointer",g.style.marginLeft="16px",g.style.fontSize="24px",g.innerHTML=" &times;",g.onclick=()=>{Hh=!0,o()},g}function f(g,v){g.setAttribute("id",v),g.innerText="Learn more",g.href="https://firebase.google.com/docs/studio/preview-apps#preview-backend",g.setAttribute("target","__blank"),g.style.paddingLeft="5px",g.style.textDecoration="underline"}function p(){const g=cI(n),v=t("text"),D=document.getElementById(v)||document.createElement("span"),k=t("learnmore"),V=document.getElementById(k)||document.createElement("a"),U=t("preprendIcon"),G=document.getElementById(U)||document.createElementNS("http://www.w3.org/2000/svg","svg");if(g.created){const q=g.element;c(q),f(V,k);const ee=l();u(G,U),q.append(G,D,V,ee),document.body.appendChild(q)}s?(D.innerText="Preview backend disconnected.",G.innerHTML=`<g clip-path="url(#clip0_6013_33858)">
<path d="M4.8 17.6L12 5.6L19.2 17.6H4.8ZM6.91667 16.4H17.0833L12 7.93333L6.91667 16.4ZM12 15.6C12.1667 15.6 12.3056 15.5444 12.4167 15.4333C12.5389 15.3111 12.6 15.1667 12.6 15C12.6 14.8333 12.5389 14.6944 12.4167 14.5833C12.3056 14.4611 12.1667 14.4 12 14.4C11.8333 14.4 11.6889 14.4611 11.5667 14.5833C11.4556 14.6944 11.4 14.8333 11.4 15C11.4 15.1667 11.4556 15.3111 11.5667 15.4333C11.6889 15.5444 11.8333 15.6 12 15.6ZM11.4 13.6H12.6V10.4H11.4V13.6Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6013_33858">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`):(G.innerHTML=`<g clip-path="url(#clip0_6083_34804)">
<path d="M11.4 15.2H12.6V11.2H11.4V15.2ZM12 10C12.1667 10 12.3056 9.94444 12.4167 9.83333C12.5389 9.71111 12.6 9.56667 12.6 9.4C12.6 9.23333 12.5389 9.09444 12.4167 8.98333C12.3056 8.86111 12.1667 8.8 12 8.8C11.8333 8.8 11.6889 8.86111 11.5667 8.98333C11.4556 9.09444 11.4 9.23333 11.4 9.4C11.4 9.56667 11.4556 9.71111 11.5667 9.83333C11.6889 9.94444 11.8333 10 12 10ZM12 18.4C11.1222 18.4 10.2944 18.2333 9.51667 17.9C8.73889 17.5667 8.05556 17.1111 7.46667 16.5333C6.88889 15.9444 6.43333 15.2611 6.1 14.4833C5.76667 13.7056 5.6 12.8778 5.6 12C5.6 11.1111 5.76667 10.2833 6.1 9.51667C6.43333 8.73889 6.88889 8.06111 7.46667 7.48333C8.05556 6.89444 8.73889 6.43333 9.51667 6.1C10.2944 5.76667 11.1222 5.6 12 5.6C12.8889 5.6 13.7167 5.76667 14.4833 6.1C15.2611 6.43333 15.9389 6.89444 16.5167 7.48333C17.1056 8.06111 17.5667 8.73889 17.9 9.51667C18.2333 10.2833 18.4 11.1111 18.4 12C18.4 12.8778 18.2333 13.7056 17.9 14.4833C17.5667 15.2611 17.1056 15.9444 16.5167 16.5333C15.9389 17.1111 15.2611 17.5667 14.4833 17.9C13.7167 18.2333 12.8889 18.4 12 18.4ZM12 17.2C13.4444 17.2 14.6722 16.6944 15.6833 15.6833C16.6944 14.6722 17.2 13.4444 17.2 12C17.2 10.5556 16.6944 9.32778 15.6833 8.31667C14.6722 7.30555 13.4444 6.8 12 6.8C10.5556 6.8 9.32778 7.30555 8.31667 8.31667C7.30556 9.32778 6.8 10.5556 6.8 12C6.8 13.4444 7.30556 14.6722 8.31667 15.6833C9.32778 16.6944 10.5556 17.2 12 17.2Z" fill="#212121"/>
</g>
<defs>
<clipPath id="clip0_6083_34804">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>`,D.innerText="Preview backend running in this workspace."),D.setAttribute("id",v)}document.readyState==="loading"?window.addEventListener("DOMContentLoaded",p):p()}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function be(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function uI(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(be())}function tp(){const r=ta()?.forceEnvironment;if(r==="node")return!0;if(r==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function lI(){return typeof window<"u"||np()}function np(){return typeof WorkerGlobalScope<"u"&&typeof self<"u"&&self instanceof WorkerGlobalScope}function hI(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function dI(){const r=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof r=="object"&&r.id!==void 0}function fI(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function pI(){const r=be();return r.indexOf("MSIE ")>=0||r.indexOf("Trident/")>=0}function rp(){return!tp()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function ip(){return!tp()&&!!navigator.userAgent&&(navigator.userAgent.includes("Safari")||navigator.userAgent.includes("WebKit"))&&!navigator.userAgent.includes("Chrome")}function sp(){try{return typeof indexedDB=="object"}catch{return!1}}function mI(){return new Promise((r,e)=>{try{let t=!0;const n="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(n);i.onsuccess=()=>{i.result.close(),t||self.indexedDB.deleteDatabase(n),r(!0)},i.onupgradeneeded=()=>{t=!1},i.onerror=()=>{e(i.error?.message||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gI="FirebaseError";class vt extends Error{constructor(e,t,n){super(t),this.code=e,this.customData=n,this.name=gI,Object.setPrototypeOf(this,vt.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,bs.prototype.create)}}class bs{constructor(e,t,n){this.service=e,this.serviceName=t,this.errors=n}create(e,...t){const n=t[0]||{},i=`${this.service}/${e}`,s=this.errors[e],o=s?_I(s,n):"Error",c=`${this.serviceName}: ${o} (${i}).`;return new vt(i,c,n)}}function _I(r,e){return r.replace(yI,(t,n)=>{const i=e[n];return i!=null?String(i):`<${n}?>`})}const yI=/\{\$([^}]+)}/g;function II(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}function lt(r,e){if(r===e)return!0;const t=Object.keys(r),n=Object.keys(e);for(const i of t){if(!n.includes(i))return!1;const s=r[i],o=e[i];if(Qh(s)&&Qh(o)){if(!lt(s,o))return!1}else if(s!==o)return!1}for(const i of n)if(!t.includes(i))return!1;return!0}function Qh(r){return r!==null&&typeof r=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ti(r){const e=[];for(const[t,n]of Object.entries(r))Array.isArray(n)?n.forEach(i=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(i))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(n));return e.length?"&"+e.join("&"):""}function qi(r){const e={};return r.replace(/^\?/,"").split("&").forEach(n=>{if(n){const[i,s]=n.split("=");e[decodeURIComponent(i)]=decodeURIComponent(s)}}),e}function zi(r){const e=r.indexOf("?");if(!e)return"";const t=r.indexOf("#",e);return r.substring(e,t>0?t:void 0)}function EI(r,e){const t=new TI(r,e);return t.subscribe.bind(t)}class TI{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(n=>{this.error(n)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,n){let i;if(e===void 0&&t===void 0&&n===void 0)throw new Error("Missing Observer.");wI(e,["next","error","complete"])?i=e:i={next:e,error:t,complete:n},i.next===void 0&&(i.next=uc),i.error===void 0&&(i.error=uc),i.complete===void 0&&(i.complete=uc);const s=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?i.error(this.finalError):i.complete()}catch{}}),this.observers.push(i),s}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(n){typeof console<"u"&&console.error&&console.error(n)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function wI(r,e){if(typeof r!="object"||r===null)return!1;for(const t of e)if(t in r&&typeof r[t]=="function")return!0;return!1}function uc(){}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function z(r){return r&&r._delegate?r._delegate:r}class Hn{constructor(e,t,n){this.name=e,this.instanceFactory=t,this.type=n,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xn="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vI{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const n=new sI;if(this.instancesDeferred.set(t,n),this.isInitialized(t)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:t});i&&n.resolve(i)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e?.identifier),n=e?.optional??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(i){if(n)return null;throw i}else{if(n)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(RI(e))try{this.getOrInitializeService({instanceIdentifier:xn})}catch{}for(const[t,n]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(t);try{const s=this.getOrInitializeService({instanceIdentifier:i});n.resolve(s)}catch{}}}}clearInstance(e=xn){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=xn){return this.instances.has(e)}getOptions(e=xn){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,n=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(n))throw Error(`${this.name}(${n}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:n,options:t});for(const[s,o]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(s);n===c&&o.resolve(i)}return i}onInit(e,t){const n=this.normalizeInstanceIdentifier(t),i=this.onInitCallbacks.get(n)??new Set;i.add(e),this.onInitCallbacks.set(n,i);const s=this.instances.get(n);return s&&e(s,n),()=>{i.delete(e)}}invokeOnInitCallbacks(e,t){const n=this.onInitCallbacks.get(t);if(n)for(const i of n)try{i(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let n=this.instances.get(e);if(!n&&this.component&&(n=this.component.instanceFactory(this.container,{instanceIdentifier:AI(e),options:t}),this.instances.set(e,n),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(n,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,n)}catch{}return n||null}normalizeInstanceIdentifier(e=xn){return this.component?this.component.multipleInstances?e:xn:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function AI(r){return r===xn?void 0:r}function RI(r){return r.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class op{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new vI(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gu=[];var J;(function(r){r[r.DEBUG=0]="DEBUG",r[r.VERBOSE=1]="VERBOSE",r[r.INFO=2]="INFO",r[r.WARN=3]="WARN",r[r.ERROR=4]="ERROR",r[r.SILENT=5]="SILENT"})(J||(J={}));const ap={debug:J.DEBUG,verbose:J.VERBOSE,info:J.INFO,warn:J.WARN,error:J.ERROR,silent:J.SILENT},SI=J.INFO,bI={[J.DEBUG]:"log",[J.VERBOSE]:"log",[J.INFO]:"info",[J.WARN]:"warn",[J.ERROR]:"error"},PI=(r,e,...t)=>{if(e<r.logLevel)return;const n=new Date().toISOString(),i=bI[e];if(i)console[i](`[${n}]  ${r.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class _u{constructor(e){this.name=e,this._logLevel=SI,this._logHandler=PI,this._userLogHandler=null,gu.push(this)}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in J))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ap[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,J.DEBUG,...e),this._logHandler(this,J.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,J.VERBOSE,...e),this._logHandler(this,J.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,J.INFO,...e),this._logHandler(this,J.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,J.WARN,...e),this._logHandler(this,J.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,J.ERROR,...e),this._logHandler(this,J.ERROR,...e)}}function CI(r){gu.forEach(e=>{e.setLogLevel(r)})}function DI(r,e){for(const t of gu){let n=null;e&&e.level&&(n=ap[e.level]),r===null?t.userLogHandler=null:t.userLogHandler=(i,s,...o)=>{const c=o.map(u=>{if(u==null)return null;if(typeof u=="string")return u;if(typeof u=="number"||typeof u=="boolean")return u.toString();if(u instanceof Error)return u.message;try{return JSON.stringify(u)}catch{return null}}).filter(u=>u).join(" ");s>=(n??i.logLevel)&&r({level:J[s].toLowerCase(),message:c,args:o,type:i.name})}}}const kI=(r,e)=>e.some(t=>r instanceof t);let Jh,Yh;function VI(){return Jh||(Jh=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function NI(){return Yh||(Yh=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const cp=new WeakMap,Dc=new WeakMap,up=new WeakMap,lc=new WeakMap,yu=new WeakMap;function OI(r){const e=new Promise((t,n)=>{const i=()=>{r.removeEventListener("success",s),r.removeEventListener("error",o)},s=()=>{t(sn(r.result)),i()},o=()=>{n(r.error),i()};r.addEventListener("success",s),r.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&cp.set(t,r)}).catch(()=>{}),yu.set(e,r),e}function xI(r){if(Dc.has(r))return;const e=new Promise((t,n)=>{const i=()=>{r.removeEventListener("complete",s),r.removeEventListener("error",o),r.removeEventListener("abort",o)},s=()=>{t(),i()},o=()=>{n(r.error||new DOMException("AbortError","AbortError")),i()};r.addEventListener("complete",s),r.addEventListener("error",o),r.addEventListener("abort",o)});Dc.set(r,e)}let kc={get(r,e,t){if(r instanceof IDBTransaction){if(e==="done")return Dc.get(r);if(e==="objectStoreNames")return r.objectStoreNames||up.get(r);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return sn(r[e])},set(r,e,t){return r[e]=t,!0},has(r,e){return r instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in r}};function MI(r){kc=r(kc)}function LI(r){return r===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const n=r.call(hc(this),e,...t);return up.set(n,e.sort?e.sort():[e]),sn(n)}:NI().includes(r)?function(...e){return r.apply(hc(this),e),sn(cp.get(this))}:function(...e){return sn(r.apply(hc(this),e))}}function FI(r){return typeof r=="function"?LI(r):(r instanceof IDBTransaction&&xI(r),kI(r,VI())?new Proxy(r,kc):r)}function sn(r){if(r instanceof IDBRequest)return OI(r);if(lc.has(r))return lc.get(r);const e=FI(r);return e!==r&&(lc.set(r,e),yu.set(e,r)),e}const hc=r=>yu.get(r);function UI(r,e,{blocked:t,upgrade:n,blocking:i,terminated:s}={}){const o=indexedDB.open(r,e),c=sn(o);return n&&o.addEventListener("upgradeneeded",u=>{n(sn(o.result),u.oldVersion,u.newVersion,sn(o.transaction),u)}),t&&o.addEventListener("blocked",u=>t(u.oldVersion,u.newVersion,u)),c.then(u=>{s&&u.addEventListener("close",()=>s()),i&&u.addEventListener("versionchange",l=>i(l.oldVersion,l.newVersion,l))}).catch(()=>{}),c}const BI=["get","getKey","getAll","getAllKeys","count"],qI=["put","add","delete","clear"],dc=new Map;function Xh(r,e){if(!(r instanceof IDBDatabase&&!(e in r)&&typeof e=="string"))return;if(dc.get(e))return dc.get(e);const t=e.replace(/FromIndex$/,""),n=e!==t,i=qI.includes(t);if(!(t in(n?IDBIndex:IDBObjectStore).prototype)||!(i||BI.includes(t)))return;const s=async function(o,...c){const u=this.transaction(o,i?"readwrite":"readonly");let l=u.store;return n&&(l=l.index(c.shift())),(await Promise.all([l[t](...c),i&&u.done]))[0]};return dc.set(e,s),s}MI(r=>({...r,get:(e,t,n)=>Xh(e,t)||r.get(e,t,n),has:(e,t)=>!!Xh(e,t)||r.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zI{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(jI(t)){const n=t.getImmediate();return`${n.library}/${n.version}`}else return null}).filter(t=>t).join(" ")}}function jI(r){return r.getComponent()?.type==="VERSION"}const No="@firebase/app",Vc="0.14.3";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nt=new _u("@firebase/app"),GI="@firebase/app-compat",$I="@firebase/analytics-compat",KI="@firebase/analytics",WI="@firebase/app-check-compat",HI="@firebase/app-check",QI="@firebase/auth",JI="@firebase/auth-compat",YI="@firebase/database",XI="@firebase/data-connect",ZI="@firebase/database-compat",eE="@firebase/functions",tE="@firebase/functions-compat",nE="@firebase/installations",rE="@firebase/installations-compat",iE="@firebase/messaging",sE="@firebase/messaging-compat",oE="@firebase/performance",aE="@firebase/performance-compat",cE="@firebase/remote-config",uE="@firebase/remote-config-compat",lE="@firebase/storage",hE="@firebase/storage-compat",dE="@firebase/firestore",fE="@firebase/ai",pE="@firebase/firestore-compat",mE="firebase",gE="12.3.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cs="[DEFAULT]",_E={[No]:"fire-core",[GI]:"fire-core-compat",[KI]:"fire-analytics",[$I]:"fire-analytics-compat",[HI]:"fire-app-check",[WI]:"fire-app-check-compat",[QI]:"fire-auth",[JI]:"fire-auth-compat",[YI]:"fire-rtdb",[XI]:"fire-data-connect",[ZI]:"fire-rtdb-compat",[eE]:"fire-fn",[tE]:"fire-fn-compat",[nE]:"fire-iid",[rE]:"fire-iid-compat",[iE]:"fire-fcm",[sE]:"fire-fcm-compat",[oE]:"fire-perf",[aE]:"fire-perf-compat",[cE]:"fire-rc",[uE]:"fire-rc-compat",[lE]:"fire-gcs",[hE]:"fire-gcs-compat",[dE]:"fire-fst",[pE]:"fire-fst-compat",[fE]:"fire-vertex","fire-js":"fire-js",[mE]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ln=new Map,kr=new Map,Vr=new Map;function Nc(r,e){try{r.container.addComponent(e)}catch(t){Nt.debug(`Component ${e.name} failed to register with FirebaseApp ${r.name}`,t)}}function yE(r,e){r.container.addOrOverwriteComponent(e)}function Qn(r){const e=r.name;if(Vr.has(e))return Nt.debug(`There were multiple attempts to register component ${e}.`),!1;Vr.set(e,r);for(const t of ln.values())Nc(t,r);for(const t of kr.values())Nc(t,r);return!0}function ni(r,e){const t=r.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),r.container.getProvider(e)}function lp(r,e,t=cs){ni(r,e).clearInstance(t)}function Iu(r){return r.options!==void 0}function hp(r){return Iu(r)?!1:"authIdToken"in r||"appCheckToken"in r||"releaseOnDeref"in r||"automaticDataCollectionEnabled"in r}function me(r){return r==null?!1:r.settings!==void 0}function IE(){Vr.clear()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const EE={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},tt=new bs("app","Firebase",EE);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dp{constructor(e,t,n){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=n,this.container.addComponent(new Hn("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw tt.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zh(r,e){const t=fu(r.split(".")[1]);if(t===null){console.error(`FirebaseServerApp ${e} is invalid: second part could not be parsed.`);return}if(JSON.parse(t).exp===void 0){console.error(`FirebaseServerApp ${e} is invalid: expiration claim could not be parsed`);return}const i=JSON.parse(t).exp*1e3,s=new Date().getTime();i-s<=0&&console.error(`FirebaseServerApp ${e} is invalid: the token has expired.`)}class TE extends dp{constructor(e,t,n,i){const s=t.automaticDataCollectionEnabled!==void 0?t.automaticDataCollectionEnabled:!0,o={name:n,automaticDataCollectionEnabled:s};if(e.apiKey!==void 0)super(e,o,i);else{const c=e;super(c.options,o,i)}this._serverConfig={automaticDataCollectionEnabled:s,...t},this._serverConfig.authIdToken&&Zh(this._serverConfig.authIdToken,"authIdToken"),this._serverConfig.appCheckToken&&Zh(this._serverConfig.appCheckToken,"appCheckToken"),this._finalizationRegistry=null,typeof FinalizationRegistry<"u"&&(this._finalizationRegistry=new FinalizationRegistry(()=>{this.automaticCleanup()})),this._refCount=0,this.incRefCount(this._serverConfig.releaseOnDeref),this._serverConfig.releaseOnDeref=void 0,t.releaseOnDeref=void 0,yt(No,Vc,"serverapp")}toJSON(){}get refCount(){return this._refCount}incRefCount(e){this.isDeleted||(this._refCount++,e!==void 0&&this._finalizationRegistry!==null&&this._finalizationRegistry.register(e,this))}decRefCount(){return this.isDeleted?0:--this._refCount}automaticCleanup(){pp(this)}get settings(){return this.checkDestroyed(),this._serverConfig}checkDestroyed(){if(this.isDeleted)throw tt.create("server-app-deleted")}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const or=gE;function fp(r,e={}){let t=r;typeof e!="object"&&(e={name:e});const n={name:cs,automaticDataCollectionEnabled:!0,...e},i=n.name;if(typeof i!="string"||!i)throw tt.create("bad-app-name",{appName:String(i)});if(t||(t=pu()),!t)throw tt.create("no-options");const s=ln.get(i);if(s){if(lt(t,s.options)&&lt(n,s.config))return s;throw tt.create("duplicate-app",{appName:i})}const o=new op(i);for(const u of Vr.values())o.addComponent(u);const c=new dp(t,n,o);return ln.set(i,c),c}function wE(r,e={}){if(lI()&&!np())throw tt.create("invalid-server-app-environment");let t,n=e||{};if(r&&(Iu(r)?t=r.options:hp(r)?n=r:t=r),n.automaticDataCollectionEnabled===void 0&&(n.automaticDataCollectionEnabled=!0),t||(t=pu()),!t)throw tt.create("no-options");const i={...n,...t};i.releaseOnDeref!==void 0&&delete i.releaseOnDeref;const s=f=>[...f].reduce((p,g)=>Math.imul(31,p)+g.charCodeAt(0)|0,0);if(n.releaseOnDeref!==void 0&&typeof FinalizationRegistry>"u")throw tt.create("finalization-registry-not-supported",{});const o=""+s(JSON.stringify(i)),c=kr.get(o);if(c)return c.incRefCount(n.releaseOnDeref),c;const u=new op(o);for(const f of Vr.values())u.addComponent(f);const l=new TE(t,n,o,u);return kr.set(o,l),l}function Eu(r=cs){const e=ln.get(r);if(!e&&r===cs&&pu())return fp();if(!e)throw tt.create("no-app",{appName:r});return e}function vE(){return Array.from(ln.values())}async function pp(r){let e=!1;const t=r.name;ln.has(t)?(e=!0,ln.delete(t)):kr.has(t)&&r.decRefCount()<=0&&(kr.delete(t),e=!0),e&&(await Promise.all(r.container.getProviders().map(n=>n.delete())),r.isDeleted=!0)}function yt(r,e,t){let n=_E[r]??r;t&&(n+=`-${t}`);const i=n.match(/\s|\//),s=e.match(/\s|\//);if(i||s){const o=[`Unable to register library "${n}" with version "${e}":`];i&&o.push(`library name "${n}" contains illegal characters (whitespace or "/")`),i&&s&&o.push("and"),s&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Nt.warn(o.join(" "));return}Qn(new Hn(`${n}-version`,()=>({library:n,version:e}),"VERSION"))}function AE(r,e){if(r!==null&&typeof r!="function")throw tt.create("invalid-log-argument");DI(r,e)}function RE(r){CI(r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const SE="firebase-heartbeat-database",bE=1,us="firebase-heartbeat-store";let fc=null;function mp(){return fc||(fc=UI(SE,bE,{upgrade:(r,e)=>{switch(e){case 0:try{r.createObjectStore(us)}catch(t){console.warn(t)}}}}).catch(r=>{throw tt.create("idb-open",{originalErrorMessage:r.message})})),fc}async function PE(r){try{const t=(await mp()).transaction(us),n=await t.objectStore(us).get(gp(r));return await t.done,n}catch(e){if(e instanceof vt)Nt.warn(e.message);else{const t=tt.create("idb-get",{originalErrorMessage:e?.message});Nt.warn(t.message)}}}async function ed(r,e){try{const n=(await mp()).transaction(us,"readwrite");await n.objectStore(us).put(e,gp(r)),await n.done}catch(t){if(t instanceof vt)Nt.warn(t.message);else{const n=tt.create("idb-set",{originalErrorMessage:t?.message});Nt.warn(n.message)}}}function gp(r){return`${r.name}!${r.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const CE=1024,DE=30;class kE{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new NE(t),this._heartbeatsCachePromise=this._storage.read().then(n=>(this._heartbeatsCache=n,n))}async triggerHeartbeat(){try{const t=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),n=td();if(this._heartbeatsCache?.heartbeats==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null)||this._heartbeatsCache.lastSentHeartbeatDate===n||this._heartbeatsCache.heartbeats.some(i=>i.date===n))return;if(this._heartbeatsCache.heartbeats.push({date:n,agent:t}),this._heartbeatsCache.heartbeats.length>DE){const i=OE(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(i,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(e){Nt.warn(e)}}async getHeartbeatsHeader(){try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,this._heartbeatsCache?.heartbeats==null||this._heartbeatsCache.heartbeats.length===0)return"";const e=td(),{heartbeatsToSend:t,unsentEntries:n}=VE(this._heartbeatsCache.heartbeats),i=Vo(JSON.stringify({version:2,heartbeats:t}));return this._heartbeatsCache.lastSentHeartbeatDate=e,n.length>0?(this._heartbeatsCache.heartbeats=n,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),i}catch(e){return Nt.warn(e),""}}}function td(){return new Date().toISOString().substring(0,10)}function VE(r,e=CE){const t=[];let n=r.slice();for(const i of r){const s=t.find(o=>o.agent===i.agent);if(s){if(s.dates.push(i.date),nd(t)>e){s.dates.pop();break}}else if(t.push({agent:i.agent,dates:[i.date]}),nd(t)>e){t.pop();break}n=n.slice(1)}return{heartbeatsToSend:t,unsentEntries:n}}class NE{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return sp()?mI().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await PE(this.app);return t?.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return ed(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const n=await this.read();return ed(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??n.lastSentHeartbeatDate,heartbeats:[...n.heartbeats,...e.heartbeats]})}else return}}function nd(r){return Vo(JSON.stringify({version:2,heartbeats:r})).length}function OE(r){if(r.length===0)return-1;let e=0,t=r[0].date;for(let n=1;n<r.length;n++)r[n].date<t&&(t=r[n].date,e=n);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xE(r){Qn(new Hn("platform-logger",e=>new zI(e),"PRIVATE")),Qn(new Hn("heartbeat",e=>new kE(e),"PRIVATE")),yt(No,Vc,r),yt(No,Vc,"esm2020"),yt("fire-js","")}xE("");var ME="firebase",LE="12.3.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */yt(ME,LE,"app");const aC=Object.freeze(Object.defineProperty({__proto__:null,FirebaseError:vt,SDK_VERSION:or,_DEFAULT_ENTRY_NAME:cs,_addComponent:Nc,_addOrOverwriteComponent:yE,_apps:ln,_clearComponents:IE,_components:Vr,_getProvider:ni,_isFirebaseApp:Iu,_isFirebaseServerApp:me,_isFirebaseServerAppSettings:hp,_registerComponent:Qn,_removeServiceInstance:lp,_serverApps:kr,deleteApp:pp,getApp:Eu,getApps:vE,initializeApp:fp,initializeServerApp:wE,onLog:AE,registerVersion:yt,setLogLevel:RE},Symbol.toStringTag,{value:"Module"}));var rd=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var on,_p;(function(){var r;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(E,_){function I(){}I.prototype=_.prototype,E.F=_.prototype,E.prototype=new I,E.prototype.constructor=E,E.D=function(w,T,b){for(var y=Array(arguments.length-2),$e=2;$e<arguments.length;$e++)y[$e-2]=arguments[$e];return _.prototype[T].apply(w,y)}}function t(){this.blockSize=-1}function n(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(n,t),n.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(E,_,I){I||(I=0);const w=Array(16);if(typeof _=="string")for(var T=0;T<16;++T)w[T]=_.charCodeAt(I++)|_.charCodeAt(I++)<<8|_.charCodeAt(I++)<<16|_.charCodeAt(I++)<<24;else for(T=0;T<16;++T)w[T]=_[I++]|_[I++]<<8|_[I++]<<16|_[I++]<<24;_=E.g[0],I=E.g[1],T=E.g[2];let b=E.g[3],y;y=_+(b^I&(T^b))+w[0]+3614090360&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[1]+3905402710&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[2]+606105819&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[3]+3250441966&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[4]+4118548399&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[5]+1200080426&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[6]+2821735955&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[7]+4249261313&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[8]+1770035416&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[9]+2336552879&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[10]+4294925233&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[11]+2304563134&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(b^I&(T^b))+w[12]+1804603682&4294967295,_=I+(y<<7&4294967295|y>>>25),y=b+(T^_&(I^T))+w[13]+4254626195&4294967295,b=_+(y<<12&4294967295|y>>>20),y=T+(I^b&(_^I))+w[14]+2792965006&4294967295,T=b+(y<<17&4294967295|y>>>15),y=I+(_^T&(b^_))+w[15]+1236535329&4294967295,I=T+(y<<22&4294967295|y>>>10),y=_+(T^b&(I^T))+w[1]+4129170786&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[6]+3225465664&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[11]+643717713&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[0]+3921069994&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[5]+3593408605&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[10]+38016083&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[15]+3634488961&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[4]+3889429448&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[9]+568446438&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[14]+3275163606&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[3]+4107603335&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[8]+1163531501&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(T^b&(I^T))+w[13]+2850285829&4294967295,_=I+(y<<5&4294967295|y>>>27),y=b+(I^T&(_^I))+w[2]+4243563512&4294967295,b=_+(y<<9&4294967295|y>>>23),y=T+(_^I&(b^_))+w[7]+1735328473&4294967295,T=b+(y<<14&4294967295|y>>>18),y=I+(b^_&(T^b))+w[12]+2368359562&4294967295,I=T+(y<<20&4294967295|y>>>12),y=_+(I^T^b)+w[5]+4294588738&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[8]+2272392833&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[11]+1839030562&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[14]+4259657740&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[1]+2763975236&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[4]+1272893353&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[7]+4139469664&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[10]+3200236656&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[13]+681279174&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[0]+3936430074&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[3]+3572445317&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[6]+76029189&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(I^T^b)+w[9]+3654602809&4294967295,_=I+(y<<4&4294967295|y>>>28),y=b+(_^I^T)+w[12]+3873151461&4294967295,b=_+(y<<11&4294967295|y>>>21),y=T+(b^_^I)+w[15]+530742520&4294967295,T=b+(y<<16&4294967295|y>>>16),y=I+(T^b^_)+w[2]+3299628645&4294967295,I=T+(y<<23&4294967295|y>>>9),y=_+(T^(I|~b))+w[0]+4096336452&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[7]+1126891415&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[14]+2878612391&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[5]+4237533241&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[12]+1700485571&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[3]+2399980690&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[10]+4293915773&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[1]+2240044497&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[8]+1873313359&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[15]+4264355552&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[6]+2734768916&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[13]+1309151649&4294967295,I=T+(y<<21&4294967295|y>>>11),y=_+(T^(I|~b))+w[4]+4149444226&4294967295,_=I+(y<<6&4294967295|y>>>26),y=b+(I^(_|~T))+w[11]+3174756917&4294967295,b=_+(y<<10&4294967295|y>>>22),y=T+(_^(b|~I))+w[2]+718787259&4294967295,T=b+(y<<15&4294967295|y>>>17),y=I+(b^(T|~_))+w[9]+3951481745&4294967295,E.g[0]=E.g[0]+_&4294967295,E.g[1]=E.g[1]+(T+(y<<21&4294967295|y>>>11))&4294967295,E.g[2]=E.g[2]+T&4294967295,E.g[3]=E.g[3]+b&4294967295}n.prototype.v=function(E,_){_===void 0&&(_=E.length);const I=_-this.blockSize,w=this.C;let T=this.h,b=0;for(;b<_;){if(T==0)for(;b<=I;)i(this,E,b),b+=this.blockSize;if(typeof E=="string"){for(;b<_;)if(w[T++]=E.charCodeAt(b++),T==this.blockSize){i(this,w),T=0;break}}else for(;b<_;)if(w[T++]=E[b++],T==this.blockSize){i(this,w),T=0;break}}this.h=T,this.o+=_},n.prototype.A=function(){var E=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);E[0]=128;for(var _=1;_<E.length-8;++_)E[_]=0;_=this.o*8;for(var I=E.length-8;I<E.length;++I)E[I]=_&255,_/=256;for(this.v(E),E=Array(16),_=0,I=0;I<4;++I)for(let w=0;w<32;w+=8)E[_++]=this.g[I]>>>w&255;return E};function s(E,_){var I=c;return Object.prototype.hasOwnProperty.call(I,E)?I[E]:I[E]=_(E)}function o(E,_){this.h=_;const I=[];let w=!0;for(let T=E.length-1;T>=0;T--){const b=E[T]|0;w&&b==_||(I[T]=b,w=!1)}this.g=I}var c={};function u(E){return-128<=E&&E<128?s(E,function(_){return new o([_|0],_<0?-1:0)}):new o([E|0],E<0?-1:0)}function l(E){if(isNaN(E)||!isFinite(E))return p;if(E<0)return V(l(-E));const _=[];let I=1;for(let w=0;E>=I;w++)_[w]=E/I|0,I*=4294967296;return new o(_,0)}function f(E,_){if(E.length==0)throw Error("number format error: empty string");if(_=_||10,_<2||36<_)throw Error("radix out of range: "+_);if(E.charAt(0)=="-")return V(f(E.substring(1),_));if(E.indexOf("-")>=0)throw Error('number format error: interior "-" character');const I=l(Math.pow(_,8));let w=p;for(let b=0;b<E.length;b+=8){var T=Math.min(8,E.length-b);const y=parseInt(E.substring(b,b+T),_);T<8?(T=l(Math.pow(_,T)),w=w.j(T).add(l(y))):(w=w.j(I),w=w.add(l(y)))}return w}var p=u(0),g=u(1),v=u(16777216);r=o.prototype,r.m=function(){if(k(this))return-V(this).m();let E=0,_=1;for(let I=0;I<this.g.length;I++){const w=this.i(I);E+=(w>=0?w:4294967296+w)*_,_*=4294967296}return E},r.toString=function(E){if(E=E||10,E<2||36<E)throw Error("radix out of range: "+E);if(D(this))return"0";if(k(this))return"-"+V(this).toString(E);const _=l(Math.pow(E,6));var I=this;let w="";for(;;){const T=ee(I,_).g;I=U(I,T.j(_));let b=((I.g.length>0?I.g[0]:I.h)>>>0).toString(E);if(I=T,D(I))return b+w;for(;b.length<6;)b="0"+b;w=b+w}},r.i=function(E){return E<0?0:E<this.g.length?this.g[E]:this.h};function D(E){if(E.h!=0)return!1;for(let _=0;_<E.g.length;_++)if(E.g[_]!=0)return!1;return!0}function k(E){return E.h==-1}r.l=function(E){return E=U(this,E),k(E)?-1:D(E)?0:1};function V(E){const _=E.g.length,I=[];for(let w=0;w<_;w++)I[w]=~E.g[w];return new o(I,~E.h).add(g)}r.abs=function(){return k(this)?V(this):this},r.add=function(E){const _=Math.max(this.g.length,E.g.length),I=[];let w=0;for(let T=0;T<=_;T++){let b=w+(this.i(T)&65535)+(E.i(T)&65535),y=(b>>>16)+(this.i(T)>>>16)+(E.i(T)>>>16);w=y>>>16,b&=65535,y&=65535,I[T]=y<<16|b}return new o(I,I[I.length-1]&-2147483648?-1:0)};function U(E,_){return E.add(V(_))}r.j=function(E){if(D(this)||D(E))return p;if(k(this))return k(E)?V(this).j(V(E)):V(V(this).j(E));if(k(E))return V(this.j(V(E)));if(this.l(v)<0&&E.l(v)<0)return l(this.m()*E.m());const _=this.g.length+E.g.length,I=[];for(var w=0;w<2*_;w++)I[w]=0;for(w=0;w<this.g.length;w++)for(let T=0;T<E.g.length;T++){const b=this.i(w)>>>16,y=this.i(w)&65535,$e=E.i(T)>>>16,Pn=E.i(T)&65535;I[2*w+2*T]+=y*Pn,G(I,2*w+2*T),I[2*w+2*T+1]+=b*Pn,G(I,2*w+2*T+1),I[2*w+2*T+1]+=y*$e,G(I,2*w+2*T+1),I[2*w+2*T+2]+=b*$e,G(I,2*w+2*T+2)}for(E=0;E<_;E++)I[E]=I[2*E+1]<<16|I[2*E];for(E=_;E<2*_;E++)I[E]=0;return new o(I,0)};function G(E,_){for(;(E[_]&65535)!=E[_];)E[_+1]+=E[_]>>>16,E[_]&=65535,_++}function q(E,_){this.g=E,this.h=_}function ee(E,_){if(D(_))throw Error("division by zero");if(D(E))return new q(p,p);if(k(E))return _=ee(V(E),_),new q(V(_.g),V(_.h));if(k(_))return _=ee(E,V(_)),new q(V(_.g),_.h);if(E.g.length>30){if(k(E)||k(_))throw Error("slowDivide_ only works with positive integers.");for(var I=g,w=_;w.l(E)<=0;)I=te(I),w=te(w);var T=X(I,1),b=X(w,1);for(w=X(w,2),I=X(I,2);!D(w);){var y=b.add(w);y.l(E)<=0&&(T=T.add(I),b=y),w=X(w,1),I=X(I,1)}return _=U(E,T.j(_)),new q(T,_)}for(T=p;E.l(_)>=0;){for(I=Math.max(1,Math.floor(E.m()/_.m())),w=Math.ceil(Math.log(I)/Math.LN2),w=w<=48?1:Math.pow(2,w-48),b=l(I),y=b.j(_);k(y)||y.l(E)>0;)I-=w,b=l(I),y=b.j(_);D(b)&&(b=g),T=T.add(b),E=U(E,y)}return new q(T,E)}r.B=function(E){return ee(this,E).h},r.and=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)&E.i(w);return new o(I,this.h&E.h)},r.or=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)|E.i(w);return new o(I,this.h|E.h)},r.xor=function(E){const _=Math.max(this.g.length,E.g.length),I=[];for(let w=0;w<_;w++)I[w]=this.i(w)^E.i(w);return new o(I,this.h^E.h)};function te(E){const _=E.g.length+1,I=[];for(let w=0;w<_;w++)I[w]=E.i(w)<<1|E.i(w-1)>>>31;return new o(I,E.h)}function X(E,_){const I=_>>5;_%=32;const w=E.g.length-I,T=[];for(let b=0;b<w;b++)T[b]=_>0?E.i(b+I)>>>_|E.i(b+I+1)<<32-_:E.i(b+I);return new o(T,E.h)}n.prototype.digest=n.prototype.A,n.prototype.reset=n.prototype.u,n.prototype.update=n.prototype.v,_p=n,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=l,o.fromString=f,on=o}).apply(typeof rd<"u"?rd:typeof self<"u"?self:typeof window<"u"?window:{});var ao=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var yp,ji,Ip,yo,Oc,Ep,Tp,wp;(function(){var r,e=Object.defineProperty;function t(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof ao=="object"&&ao];for(var h=0;h<a.length;++h){var d=a[h];if(d&&d.Math==Math)return d}throw Error("Cannot find global object")}var n=t(this);function i(a,h){if(h)e:{var d=n;a=a.split(".");for(var m=0;m<a.length-1;m++){var R=a[m];if(!(R in d))break e;d=d[R]}a=a[a.length-1],m=d[a],h=h(m),h!=m&&h!=null&&e(d,a,{configurable:!0,writable:!0,value:h})}}i("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(a){return a||function(h){var d=[],m;for(m in h)Object.prototype.hasOwnProperty.call(h,m)&&d.push([m,h[m]]);return d}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var s=s||{},o=this||self;function c(a){var h=typeof a;return h=="object"&&a!=null||h=="function"}function u(a,h,d){return a.call.apply(a.bind,arguments)}function l(a,h,d){return l=u,l.apply(null,arguments)}function f(a,h){var d=Array.prototype.slice.call(arguments,1);return function(){var m=d.slice();return m.push.apply(m,arguments),a.apply(this,m)}}function p(a,h){function d(){}d.prototype=h.prototype,a.Z=h.prototype,a.prototype=new d,a.prototype.constructor=a,a.Ob=function(m,R,P){for(var L=Array(arguments.length-2),W=2;W<arguments.length;W++)L[W-2]=arguments[W];return h.prototype[R].apply(m,L)}}var g=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function v(a){const h=a.length;if(h>0){const d=Array(h);for(let m=0;m<h;m++)d[m]=a[m];return d}return[]}function D(a,h){for(let m=1;m<arguments.length;m++){const R=arguments[m];var d=typeof R;if(d=d!="object"?d:R?Array.isArray(R)?"array":d:"null",d=="array"||d=="object"&&typeof R.length=="number"){d=a.length||0;const P=R.length||0;a.length=d+P;for(let L=0;L<P;L++)a[d+L]=R[L]}else a.push(R)}}class k{constructor(h,d){this.i=h,this.j=d,this.h=0,this.g=null}get(){let h;return this.h>0?(this.h--,h=this.g,this.g=h.next,h.next=null):h=this.i(),h}}function V(a){o.setTimeout(()=>{throw a},0)}function U(){var a=E;let h=null;return a.g&&(h=a.g,a.g=a.g.next,a.g||(a.h=null),h.next=null),h}class G{constructor(){this.h=this.g=null}add(h,d){const m=q.get();m.set(h,d),this.h?this.h.next=m:this.g=m,this.h=m}}var q=new k(()=>new ee,a=>a.reset());class ee{constructor(){this.next=this.g=this.h=null}set(h,d){this.h=h,this.g=d,this.next=null}reset(){this.next=this.g=this.h=null}}let te,X=!1,E=new G,_=()=>{const a=Promise.resolve(void 0);te=()=>{a.then(I)}};function I(){for(var a;a=U();){try{a.h.call(a.g)}catch(d){V(d)}var h=q;h.j(a),h.h<100&&(h.h++,a.next=h.g,h.g=a)}X=!1}function w(){this.u=this.u,this.C=this.C}w.prototype.u=!1,w.prototype.dispose=function(){this.u||(this.u=!0,this.N())},w.prototype[Symbol.dispose]=function(){this.dispose()},w.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(a,h){this.type=a,this.g=this.target=h,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var b=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,h=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const d=()=>{};o.addEventListener("test",d,h),o.removeEventListener("test",d,h)}catch{}return a}();function y(a){return/^[\s\xa0]*$/.test(a)}function $e(a,h){T.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,h)}p($e,T),$e.prototype.init=function(a,h){const d=this.type=a.type,m=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=h,h=a.relatedTarget,h||(d=="mouseover"?h=a.fromElement:d=="mouseout"&&(h=a.toElement)),this.relatedTarget=h,m?(this.clientX=m.clientX!==void 0?m.clientX:m.pageX,this.clientY=m.clientY!==void 0?m.clientY:m.pageY,this.screenX=m.screenX||0,this.screenY=m.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&$e.Z.h.call(this)},$e.prototype.h=function(){$e.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var Pn="closure_listenable_"+(Math.random()*1e6|0),Iy=0;function Ey(a,h,d,m,R){this.listener=a,this.proxy=null,this.src=h,this.type=d,this.capture=!!m,this.ha=R,this.key=++Iy,this.da=this.fa=!1}function Ks(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function Ws(a,h,d){for(const m in a)h.call(d,a[m],m,a)}function Ty(a,h){for(const d in a)h.call(void 0,a[d],d,a)}function Kl(a){const h={};for(const d in a)h[d]=a[d];return h}const Wl="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Hl(a,h){let d,m;for(let R=1;R<arguments.length;R++){m=arguments[R];for(d in m)a[d]=m[d];for(let P=0;P<Wl.length;P++)d=Wl[P],Object.prototype.hasOwnProperty.call(m,d)&&(a[d]=m[d])}}function Hs(a){this.src=a,this.g={},this.h=0}Hs.prototype.add=function(a,h,d,m,R){const P=a.toString();a=this.g[P],a||(a=this.g[P]=[],this.h++);const L=Ba(a,h,m,R);return L>-1?(h=a[L],d||(h.fa=!1)):(h=new Ey(h,this.src,P,!!m,R),h.fa=d,a.push(h)),h};function Ua(a,h){const d=h.type;if(d in a.g){var m=a.g[d],R=Array.prototype.indexOf.call(m,h,void 0),P;(P=R>=0)&&Array.prototype.splice.call(m,R,1),P&&(Ks(h),a.g[d].length==0&&(delete a.g[d],a.h--))}}function Ba(a,h,d,m){for(let R=0;R<a.length;++R){const P=a[R];if(!P.da&&P.listener==h&&P.capture==!!d&&P.ha==m)return R}return-1}var qa="closure_lm_"+(Math.random()*1e6|0),za={};function Ql(a,h,d,m,R){if(Array.isArray(h)){for(let P=0;P<h.length;P++)Ql(a,h[P],d,m,R);return null}return d=Xl(d),a&&a[Pn]?a.J(h,d,c(m)?!!m.capture:!1,R):wy(a,h,d,!1,m,R)}function wy(a,h,d,m,R,P){if(!h)throw Error("Invalid event type");const L=c(R)?!!R.capture:!!R;let W=Ga(a);if(W||(a[qa]=W=new Hs(a)),d=W.add(h,d,m,L,P),d.proxy)return d;if(m=vy(),d.proxy=m,m.src=a,m.listener=d,a.addEventListener)b||(R=L),R===void 0&&(R=!1),a.addEventListener(h.toString(),m,R);else if(a.attachEvent)a.attachEvent(Yl(h.toString()),m);else if(a.addListener&&a.removeListener)a.addListener(m);else throw Error("addEventListener and attachEvent are unavailable.");return d}function vy(){function a(d){return h.call(a.src,a.listener,d)}const h=Ay;return a}function Jl(a,h,d,m,R){if(Array.isArray(h))for(var P=0;P<h.length;P++)Jl(a,h[P],d,m,R);else m=c(m)?!!m.capture:!!m,d=Xl(d),a&&a[Pn]?(a=a.i,P=String(h).toString(),P in a.g&&(h=a.g[P],d=Ba(h,d,m,R),d>-1&&(Ks(h[d]),Array.prototype.splice.call(h,d,1),h.length==0&&(delete a.g[P],a.h--)))):a&&(a=Ga(a))&&(h=a.g[h.toString()],a=-1,h&&(a=Ba(h,d,m,R)),(d=a>-1?h[a]:null)&&ja(d))}function ja(a){if(typeof a!="number"&&a&&!a.da){var h=a.src;if(h&&h[Pn])Ua(h.i,a);else{var d=a.type,m=a.proxy;h.removeEventListener?h.removeEventListener(d,m,a.capture):h.detachEvent?h.detachEvent(Yl(d),m):h.addListener&&h.removeListener&&h.removeListener(m),(d=Ga(h))?(Ua(d,a),d.h==0&&(d.src=null,h[qa]=null)):Ks(a)}}}function Yl(a){return a in za?za[a]:za[a]="on"+a}function Ay(a,h){if(a.da)a=!0;else{h=new $e(h,this);const d=a.listener,m=a.ha||a.src;a.fa&&ja(a),a=d.call(m,h)}return a}function Ga(a){return a=a[qa],a instanceof Hs?a:null}var $a="__closure_events_fn_"+(Math.random()*1e9>>>0);function Xl(a){return typeof a=="function"?a:(a[$a]||(a[$a]=function(h){return a.handleEvent(h)}),a[$a])}function Le(){w.call(this),this.i=new Hs(this),this.M=this,this.G=null}p(Le,w),Le.prototype[Pn]=!0,Le.prototype.removeEventListener=function(a,h,d,m){Jl(this,a,h,d,m)};function ze(a,h){var d,m=a.G;if(m)for(d=[];m;m=m.G)d.push(m);if(a=a.M,m=h.type||h,typeof h=="string")h=new T(h,a);else if(h instanceof T)h.target=h.target||a;else{var R=h;h=new T(m,a),Hl(h,R)}R=!0;let P,L;if(d)for(L=d.length-1;L>=0;L--)P=h.g=d[L],R=Qs(P,m,!0,h)&&R;if(P=h.g=a,R=Qs(P,m,!0,h)&&R,R=Qs(P,m,!1,h)&&R,d)for(L=0;L<d.length;L++)P=h.g=d[L],R=Qs(P,m,!1,h)&&R}Le.prototype.N=function(){if(Le.Z.N.call(this),this.i){var a=this.i;for(const h in a.g){const d=a.g[h];for(let m=0;m<d.length;m++)Ks(d[m]);delete a.g[h],a.h--}}this.G=null},Le.prototype.J=function(a,h,d,m){return this.i.add(String(a),h,!1,d,m)},Le.prototype.K=function(a,h,d,m){return this.i.add(String(a),h,!0,d,m)};function Qs(a,h,d,m){if(h=a.i.g[String(h)],!h)return!0;h=h.concat();let R=!0;for(let P=0;P<h.length;++P){const L=h[P];if(L&&!L.da&&L.capture==d){const W=L.listener,Se=L.ha||L.src;L.fa&&Ua(a.i,L),R=W.call(Se,m)!==!1&&R}}return R&&!m.defaultPrevented}function Ry(a,h){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=l(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(h)>2147483647?-1:o.setTimeout(a,h||0)}function Zl(a){a.g=Ry(()=>{a.g=null,a.i&&(a.i=!1,Zl(a))},a.l);const h=a.h;a.h=null,a.m.apply(null,h)}class Sy extends w{constructor(h,d){super(),this.m=h,this.l=d,this.h=null,this.i=!1,this.g=null}j(h){this.h=arguments,this.g?this.i=!0:Zl(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function Ii(a){w.call(this),this.h=a,this.g={}}p(Ii,w);var eh=[];function th(a){Ws(a.g,function(h,d){this.g.hasOwnProperty(d)&&ja(h)},a),a.g={}}Ii.prototype.N=function(){Ii.Z.N.call(this),th(this)},Ii.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Ka=o.JSON.stringify,by=o.JSON.parse,Py=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function nh(){}function rh(){}var Ei={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Wa(){T.call(this,"d")}p(Wa,T);function Ha(){T.call(this,"c")}p(Ha,T);var Cn={},ih=null;function Js(){return ih=ih||new Le}Cn.Ia="serverreachability";function sh(a){T.call(this,Cn.Ia,a)}p(sh,T);function Ti(a){const h=Js();ze(h,new sh(h))}Cn.STAT_EVENT="statevent";function oh(a,h){T.call(this,Cn.STAT_EVENT,a),this.stat=h}p(oh,T);function je(a){const h=Js();ze(h,new oh(h,a))}Cn.Ja="timingevent";function ah(a,h){T.call(this,Cn.Ja,a),this.size=h}p(ah,T);function wi(a,h){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},h)}function vi(){this.g=!0}vi.prototype.ua=function(){this.g=!1};function Cy(a,h,d,m,R,P){a.info(function(){if(a.g)if(P){var L="",W=P.split("&");for(let ae=0;ae<W.length;ae++){var Se=W[ae].split("=");if(Se.length>1){const De=Se[0];Se=Se[1];const dt=De.split("_");L=dt.length>=2&&dt[1]=="type"?L+(De+"="+Se+"&"):L+(De+"=redacted&")}}}else L=null;else L=P;return"XMLHTTP REQ ("+m+") [attempt "+R+"]: "+h+`
`+d+`
`+L})}function Dy(a,h,d,m,R,P,L){a.info(function(){return"XMLHTTP RESP ("+m+") [ attempt "+R+"]: "+h+`
`+d+`
`+P+" "+L})}function fr(a,h,d,m){a.info(function(){return"XMLHTTP TEXT ("+h+"): "+Vy(a,d)+(m?" "+m:"")})}function ky(a,h){a.info(function(){return"TIMEOUT: "+h})}vi.prototype.info=function(){};function Vy(a,h){if(!a.g)return h;if(!h)return null;try{const P=JSON.parse(h);if(P){for(a=0;a<P.length;a++)if(Array.isArray(P[a])){var d=P[a];if(!(d.length<2)){var m=d[1];if(Array.isArray(m)&&!(m.length<1)){var R=m[0];if(R!="noop"&&R!="stop"&&R!="close")for(let L=1;L<m.length;L++)m[L]=""}}}}return Ka(P)}catch{return h}}var Ys={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},ch={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},uh;function Qa(){}p(Qa,nh),Qa.prototype.g=function(){return new XMLHttpRequest},uh=new Qa;function Ai(a){return encodeURIComponent(String(a))}function Ny(a){var h=1;a=a.split(":");const d=[];for(;h>0&&a.length;)d.push(a.shift()),h--;return a.length&&d.push(a.join(":")),d}function Gt(a,h,d,m){this.j=a,this.i=h,this.l=d,this.S=m||1,this.V=new Ii(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new lh}function lh(){this.i=null,this.g="",this.h=!1}var hh={},Ja={};function Ya(a,h,d){a.M=1,a.A=Zs(ht(h)),a.u=d,a.R=!0,dh(a,null)}function dh(a,h){a.F=Date.now(),Xs(a),a.B=ht(a.A);var d=a.B,m=a.S;Array.isArray(m)||(m=[String(m)]),Rh(d.i,"t",m),a.C=0,d=a.j.L,a.h=new lh,a.g=jh(a.j,d?h:null,!a.u),a.P>0&&(a.O=new Sy(l(a.Y,a,a.g),a.P)),h=a.V,d=a.g,m=a.ba;var R="readystatechange";Array.isArray(R)||(R&&(eh[0]=R.toString()),R=eh);for(let P=0;P<R.length;P++){const L=Ql(d,R[P],m||h.handleEvent,!1,h.h||h);if(!L)break;h.g[L.key]=L}h=a.J?Kl(a.J):{},a.u?(a.v||(a.v="POST"),h["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,h)):(a.v="GET",a.g.ea(a.B,a.v,null,h)),Ti(),Cy(a.i,a.v,a.B,a.l,a.S,a.u)}Gt.prototype.ba=function(a){a=a.target;const h=this.O;h&&Wt(a)==3?h.j():this.Y(a)},Gt.prototype.Y=function(a){try{if(a==this.g)e:{const W=Wt(this.g),Se=this.g.ya(),ae=this.g.ca();if(!(W<3)&&(W!=3||this.g&&(this.h.h||this.g.la()||Vh(this.g)))){this.K||W!=4||Se==7||(Se==8||ae<=0?Ti(3):Ti(2)),Xa(this);var h=this.g.ca();this.X=h;var d=Oy(this);if(this.o=h==200,Dy(this.i,this.v,this.B,this.l,this.S,W,h),this.o){if(this.U&&!this.L){t:{if(this.g){var m,R=this.g;if((m=R.g?R.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!y(m)){var P=m;break t}}P=null}if(a=P)fr(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Za(this,a);else{this.o=!1,this.m=3,je(12),Dn(this),Ri(this);break e}}if(this.R){a=!0;let De;for(;!this.K&&this.C<d.length;)if(De=xy(this,d),De==Ja){W==4&&(this.m=4,je(14),a=!1),fr(this.i,this.l,null,"[Incomplete Response]");break}else if(De==hh){this.m=4,je(15),fr(this.i,this.l,d,"[Invalid Chunk]"),a=!1;break}else fr(this.i,this.l,De,null),Za(this,De);if(fh(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),W!=4||d.length!=0||this.h.h||(this.m=1,je(16),a=!1),this.o=this.o&&a,!a)fr(this.i,this.l,d,"[Invalid Chunked Response]"),Dn(this),Ri(this);else if(d.length>0&&!this.W){this.W=!0;var L=this.j;L.g==this&&L.aa&&!L.P&&(L.j.info("Great, no buffering proxy detected. Bytes received: "+d.length),ac(L),L.P=!0,je(11))}}else fr(this.i,this.l,d,null),Za(this,d);W==4&&Dn(this),this.o&&!this.K&&(W==4?Uh(this.j,this):(this.o=!1,Xs(this)))}else Qy(this.g),h==400&&d.indexOf("Unknown SID")>0?(this.m=3,je(12)):(this.m=0,je(13)),Dn(this),Ri(this)}}}catch{}finally{}};function Oy(a){if(!fh(a))return a.g.la();const h=Vh(a.g);if(h==="")return"";let d="";const m=h.length,R=Wt(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return Dn(a),Ri(a),"";a.h.i=new o.TextDecoder}for(let P=0;P<m;P++)a.h.h=!0,d+=a.h.i.decode(h[P],{stream:!(R&&P==m-1)});return h.length=0,a.h.g+=d,a.C=0,a.h.g}function fh(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function xy(a,h){var d=a.C,m=h.indexOf(`
`,d);return m==-1?Ja:(d=Number(h.substring(d,m)),isNaN(d)?hh:(m+=1,m+d>h.length?Ja:(h=h.slice(m,m+d),a.C=m+d,h)))}Gt.prototype.cancel=function(){this.K=!0,Dn(this)};function Xs(a){a.T=Date.now()+a.H,ph(a,a.H)}function ph(a,h){if(a.D!=null)throw Error("WatchDog timer not null");a.D=wi(l(a.aa,a),h)}function Xa(a){a.D&&(o.clearTimeout(a.D),a.D=null)}Gt.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(ky(this.i,this.B),this.M!=2&&(Ti(),je(17)),Dn(this),this.m=2,Ri(this)):ph(this,this.T-a)};function Ri(a){a.j.I==0||a.K||Uh(a.j,a)}function Dn(a){Xa(a);var h=a.O;h&&typeof h.dispose=="function"&&h.dispose(),a.O=null,th(a.V),a.g&&(h=a.g,a.g=null,h.abort(),h.dispose())}function Za(a,h){try{var d=a.j;if(d.I!=0&&(d.g==a||ec(d.h,a))){if(!a.L&&ec(d.h,a)&&d.I==3){try{var m=d.Ba.g.parse(h)}catch{m=null}if(Array.isArray(m)&&m.length==3){var R=m;if(R[0]==0){e:if(!d.v){if(d.g)if(d.g.F+3e3<a.F)io(d),no(d);else break e;oc(d),je(18)}}else d.xa=R[1],0<d.xa-d.K&&R[2]<37500&&d.F&&d.A==0&&!d.C&&(d.C=wi(l(d.Va,d),6e3));_h(d.h)<=1&&d.ta&&(d.ta=void 0)}else Vn(d,11)}else if((a.L||d.g==a)&&io(d),!y(h))for(R=d.Ba.g.parse(h),h=0;h<R.length;h++){let ae=R[h];const De=ae[0];if(!(De<=d.K))if(d.K=De,ae=ae[1],d.I==2)if(ae[0]=="c"){d.M=ae[1],d.ba=ae[2];const dt=ae[3];dt!=null&&(d.ka=dt,d.j.info("VER="+d.ka));const Nn=ae[4];Nn!=null&&(d.za=Nn,d.j.info("SVER="+d.za));const Ht=ae[5];Ht!=null&&typeof Ht=="number"&&Ht>0&&(m=1.5*Ht,d.O=m,d.j.info("backChannelRequestTimeoutMs_="+m)),m=d;const Qt=a.g;if(Qt){const oo=Qt.g?Qt.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(oo){var P=m.h;P.g||oo.indexOf("spdy")==-1&&oo.indexOf("quic")==-1&&oo.indexOf("h2")==-1||(P.j=P.l,P.g=new Set,P.h&&(tc(P,P.h),P.h=null))}if(m.G){const cc=Qt.g?Qt.g.getResponseHeader("X-HTTP-Session-Id"):null;cc&&(m.wa=cc,ue(m.J,m.G,cc))}}d.I=3,d.l&&d.l.ra(),d.aa&&(d.T=Date.now()-a.F,d.j.info("Handshake RTT: "+d.T+"ms")),m=d;var L=a;if(m.na=zh(m,m.L?m.ba:null,m.W),L.L){yh(m.h,L);var W=L,Se=m.O;Se&&(W.H=Se),W.D&&(Xa(W),Xs(W)),m.g=L}else Lh(m);d.i.length>0&&ro(d)}else ae[0]!="stop"&&ae[0]!="close"||Vn(d,7);else d.I==3&&(ae[0]=="stop"||ae[0]=="close"?ae[0]=="stop"?Vn(d,7):sc(d):ae[0]!="noop"&&d.l&&d.l.qa(ae),d.A=0)}}Ti(4)}catch{}}var My=class{constructor(a,h){this.g=a,this.map=h}};function mh(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function gh(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function _h(a){return a.h?1:a.g?a.g.size:0}function ec(a,h){return a.h?a.h==h:a.g?a.g.has(h):!1}function tc(a,h){a.g?a.g.add(h):a.h=h}function yh(a,h){a.h&&a.h==h?a.h=null:a.g&&a.g.has(h)&&a.g.delete(h)}mh.prototype.cancel=function(){if(this.i=Ih(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function Ih(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let h=a.i;for(const d of a.g.values())h=h.concat(d.G);return h}return v(a.i)}var Eh=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function Ly(a,h){if(a){a=a.split("&");for(let d=0;d<a.length;d++){const m=a[d].indexOf("=");let R,P=null;m>=0?(R=a[d].substring(0,m),P=a[d].substring(m+1)):R=a[d],h(R,P?decodeURIComponent(P.replace(/\+/g," ")):"")}}}function $t(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let h;a instanceof $t?(this.l=a.l,Si(this,a.j),this.o=a.o,this.g=a.g,bi(this,a.u),this.h=a.h,nc(this,Sh(a.i)),this.m=a.m):a&&(h=String(a).match(Eh))?(this.l=!1,Si(this,h[1]||"",!0),this.o=Pi(h[2]||""),this.g=Pi(h[3]||"",!0),bi(this,h[4]),this.h=Pi(h[5]||"",!0),nc(this,h[6]||"",!0),this.m=Pi(h[7]||"")):(this.l=!1,this.i=new Di(null,this.l))}$t.prototype.toString=function(){const a=[];var h=this.j;h&&a.push(Ci(h,Th,!0),":");var d=this.g;return(d||h=="file")&&(a.push("//"),(h=this.o)&&a.push(Ci(h,Th,!0),"@"),a.push(Ai(d).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),d=this.u,d!=null&&a.push(":",String(d))),(d=this.h)&&(this.g&&d.charAt(0)!="/"&&a.push("/"),a.push(Ci(d,d.charAt(0)=="/"?By:Uy,!0))),(d=this.i.toString())&&a.push("?",d),(d=this.m)&&a.push("#",Ci(d,zy)),a.join("")},$t.prototype.resolve=function(a){const h=ht(this);let d=!!a.j;d?Si(h,a.j):d=!!a.o,d?h.o=a.o:d=!!a.g,d?h.g=a.g:d=a.u!=null;var m=a.h;if(d)bi(h,a.u);else if(d=!!a.h){if(m.charAt(0)!="/")if(this.g&&!this.h)m="/"+m;else{var R=h.h.lastIndexOf("/");R!=-1&&(m=h.h.slice(0,R+1)+m)}if(R=m,R==".."||R==".")m="";else if(R.indexOf("./")!=-1||R.indexOf("/.")!=-1){m=R.lastIndexOf("/",0)==0,R=R.split("/");const P=[];for(let L=0;L<R.length;){const W=R[L++];W=="."?m&&L==R.length&&P.push(""):W==".."?((P.length>1||P.length==1&&P[0]!="")&&P.pop(),m&&L==R.length&&P.push("")):(P.push(W),m=!0)}m=P.join("/")}else m=R}return d?h.h=m:d=a.i.toString()!=="",d?nc(h,Sh(a.i)):d=!!a.m,d&&(h.m=a.m),h};function ht(a){return new $t(a)}function Si(a,h,d){a.j=d?Pi(h,!0):h,a.j&&(a.j=a.j.replace(/:$/,""))}function bi(a,h){if(h){if(h=Number(h),isNaN(h)||h<0)throw Error("Bad port number "+h);a.u=h}else a.u=null}function nc(a,h,d){h instanceof Di?(a.i=h,jy(a.i,a.l)):(d||(h=Ci(h,qy)),a.i=new Di(h,a.l))}function ue(a,h,d){a.i.set(h,d)}function Zs(a){return ue(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function Pi(a,h){return a?h?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function Ci(a,h,d){return typeof a=="string"?(a=encodeURI(a).replace(h,Fy),d&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function Fy(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var Th=/[#\/\?@]/g,Uy=/[#\?:]/g,By=/[#\?]/g,qy=/[#\?@]/g,zy=/#/g;function Di(a,h){this.h=this.g=null,this.i=a||null,this.j=!!h}function kn(a){a.g||(a.g=new Map,a.h=0,a.i&&Ly(a.i,function(h,d){a.add(decodeURIComponent(h.replace(/\+/g," ")),d)}))}r=Di.prototype,r.add=function(a,h){kn(this),this.i=null,a=pr(this,a);let d=this.g.get(a);return d||this.g.set(a,d=[]),d.push(h),this.h+=1,this};function wh(a,h){kn(a),h=pr(a,h),a.g.has(h)&&(a.i=null,a.h-=a.g.get(h).length,a.g.delete(h))}function vh(a,h){return kn(a),h=pr(a,h),a.g.has(h)}r.forEach=function(a,h){kn(this),this.g.forEach(function(d,m){d.forEach(function(R){a.call(h,R,m,this)},this)},this)};function Ah(a,h){kn(a);let d=[];if(typeof h=="string")vh(a,h)&&(d=d.concat(a.g.get(pr(a,h))));else for(a=Array.from(a.g.values()),h=0;h<a.length;h++)d=d.concat(a[h]);return d}r.set=function(a,h){return kn(this),this.i=null,a=pr(this,a),vh(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[h]),this.h+=1,this},r.get=function(a,h){return a?(a=Ah(this,a),a.length>0?String(a[0]):h):h};function Rh(a,h,d){wh(a,h),d.length>0&&(a.i=null,a.g.set(pr(a,h),v(d)),a.h+=d.length)}r.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],h=Array.from(this.g.keys());for(let m=0;m<h.length;m++){var d=h[m];const R=Ai(d);d=Ah(this,d);for(let P=0;P<d.length;P++){let L=R;d[P]!==""&&(L+="="+Ai(d[P])),a.push(L)}}return this.i=a.join("&")};function Sh(a){const h=new Di;return h.i=a.i,a.g&&(h.g=new Map(a.g),h.h=a.h),h}function pr(a,h){return h=String(h),a.j&&(h=h.toLowerCase()),h}function jy(a,h){h&&!a.j&&(kn(a),a.i=null,a.g.forEach(function(d,m){const R=m.toLowerCase();m!=R&&(wh(this,m),Rh(this,R,d))},a)),a.j=h}function Gy(a,h){const d=new vi;if(o.Image){const m=new Image;m.onload=f(Kt,d,"TestLoadImage: loaded",!0,h,m),m.onerror=f(Kt,d,"TestLoadImage: error",!1,h,m),m.onabort=f(Kt,d,"TestLoadImage: abort",!1,h,m),m.ontimeout=f(Kt,d,"TestLoadImage: timeout",!1,h,m),o.setTimeout(function(){m.ontimeout&&m.ontimeout()},1e4),m.src=a}else h(!1)}function $y(a,h){const d=new vi,m=new AbortController,R=setTimeout(()=>{m.abort(),Kt(d,"TestPingServer: timeout",!1,h)},1e4);fetch(a,{signal:m.signal}).then(P=>{clearTimeout(R),P.ok?Kt(d,"TestPingServer: ok",!0,h):Kt(d,"TestPingServer: server error",!1,h)}).catch(()=>{clearTimeout(R),Kt(d,"TestPingServer: error",!1,h)})}function Kt(a,h,d,m,R){try{R&&(R.onload=null,R.onerror=null,R.onabort=null,R.ontimeout=null),m(d)}catch{}}function Ky(){this.g=new Py}function rc(a){this.i=a.Sb||null,this.h=a.ab||!1}p(rc,nh),rc.prototype.g=function(){return new eo(this.i,this.h)};function eo(a,h){Le.call(this),this.H=a,this.o=h,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}p(eo,Le),r=eo.prototype,r.open=function(a,h){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=h,this.readyState=1,Vi(this)},r.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const h={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(h.body=a),(this.H||o).fetch(new Request(this.D,h)).then(this.Pa.bind(this),this.ga.bind(this))},r.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,ki(this)),this.readyState=0},r.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Vi(this)),this.g&&(this.readyState=3,Vi(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;bh(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function bh(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}r.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var h=a.value?a.value:new Uint8Array(0);(h=this.B.decode(h,{stream:!a.done}))&&(this.response=this.responseText+=h)}a.done?ki(this):Vi(this),this.readyState==3&&bh(this)}},r.Oa=function(a){this.g&&(this.response=this.responseText=a,ki(this))},r.Na=function(a){this.g&&(this.response=a,ki(this))},r.ga=function(){this.g&&ki(this)};function ki(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Vi(a)}r.setRequestHeader=function(a,h){this.A.append(a,h)},r.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},r.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],h=this.h.entries();for(var d=h.next();!d.done;)d=d.value,a.push(d[0]+": "+d[1]),d=h.next();return a.join(`\r
`)};function Vi(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(eo.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function Ph(a){let h="";return Ws(a,function(d,m){h+=m,h+=":",h+=d,h+=`\r
`}),h}function ic(a,h,d){e:{for(m in d){var m=!1;break e}m=!0}m||(d=Ph(d),typeof a=="string"?d!=null&&Ai(d):ue(a,h,d))}function Ie(a){Le.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}p(Ie,Le);var Wy=/^https?$/i,Hy=["POST","PUT"];r=Ie.prototype,r.Fa=function(a){this.H=a},r.ea=function(a,h,d,m){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);h=h?h.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():uh.g(),this.g.onreadystatechange=g(l(this.Ca,this));try{this.B=!0,this.g.open(h,String(a),!0),this.B=!1}catch(P){Ch(this,P);return}if(a=d||"",d=new Map(this.headers),m)if(Object.getPrototypeOf(m)===Object.prototype)for(var R in m)d.set(R,m[R]);else if(typeof m.keys=="function"&&typeof m.get=="function")for(const P of m.keys())d.set(P,m.get(P));else throw Error("Unknown input type for opt_headers: "+String(m));m=Array.from(d.keys()).find(P=>P.toLowerCase()=="content-type"),R=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(Hy,h,void 0)>=0)||m||R||d.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[P,L]of d)this.g.setRequestHeader(P,L);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(P){Ch(this,P)}};function Ch(a,h){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=h,a.o=5,Dh(a),to(a)}function Dh(a){a.A||(a.A=!0,ze(a,"complete"),ze(a,"error"))}r.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,ze(this,"complete"),ze(this,"abort"),to(this))},r.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),to(this,!0)),Ie.Z.N.call(this)},r.Ca=function(){this.u||(this.B||this.v||this.j?kh(this):this.Xa())},r.Xa=function(){kh(this)};function kh(a){if(a.h&&typeof s<"u"){if(a.v&&Wt(a)==4)setTimeout(a.Ca.bind(a),0);else if(ze(a,"readystatechange"),Wt(a)==4){a.h=!1;try{const P=a.ca();e:switch(P){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var h=!0;break e;default:h=!1}var d;if(!(d=h)){var m;if(m=P===0){let L=String(a.D).match(Eh)[1]||null;!L&&o.self&&o.self.location&&(L=o.self.location.protocol.slice(0,-1)),m=!Wy.test(L?L.toLowerCase():"")}d=m}if(d)ze(a,"complete"),ze(a,"success");else{a.o=6;try{var R=Wt(a)>2?a.g.statusText:""}catch{R=""}a.l=R+" ["+a.ca()+"]",Dh(a)}}finally{to(a)}}}}function to(a,h){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const d=a.g;a.g=null,h||ze(a,"ready");try{d.onreadystatechange=null}catch{}}}r.isActive=function(){return!!this.g};function Wt(a){return a.g?a.g.readyState:0}r.ca=function(){try{return Wt(this)>2?this.g.status:-1}catch{return-1}},r.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},r.La=function(a){if(this.g){var h=this.g.responseText;return a&&h.indexOf(a)==0&&(h=h.substring(a.length)),by(h)}};function Vh(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function Qy(a){const h={};a=(a.g&&Wt(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let m=0;m<a.length;m++){if(y(a[m]))continue;var d=Ny(a[m]);const R=d[0];if(d=d[1],typeof d!="string")continue;d=d.trim();const P=h[R]||[];h[R]=P,P.push(d)}Ty(h,function(m){return m.join(", ")})}r.ya=function(){return this.o},r.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ni(a,h,d){return d&&d.internalChannelParams&&d.internalChannelParams[a]||h}function Nh(a){this.za=0,this.i=[],this.j=new vi,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Ni("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Ni("baseRetryDelayMs",5e3,a),this.Za=Ni("retryDelaySeedMs",1e4,a),this.Ta=Ni("forwardChannelMaxRetries",2,a),this.va=Ni("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new mh(a&&a.concurrentRequestLimit),this.Ba=new Ky,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}r=Nh.prototype,r.ka=8,r.I=1,r.connect=function(a,h,d,m){je(0),this.W=a,this.H=h||{},d&&m!==void 0&&(this.H.OSID=d,this.H.OAID=m),this.F=this.X,this.J=zh(this,null,this.W),ro(this)};function sc(a){if(Oh(a),a.I==3){var h=a.V++,d=ht(a.J);if(ue(d,"SID",a.M),ue(d,"RID",h),ue(d,"TYPE","terminate"),Oi(a,d),h=new Gt(a,a.j,h),h.M=2,h.A=Zs(ht(d)),d=!1,o.navigator&&o.navigator.sendBeacon)try{d=o.navigator.sendBeacon(h.A.toString(),"")}catch{}!d&&o.Image&&(new Image().src=h.A,d=!0),d||(h.g=jh(h.j,null),h.g.ea(h.A)),h.F=Date.now(),Xs(h)}qh(a)}function no(a){a.g&&(ac(a),a.g.cancel(),a.g=null)}function Oh(a){no(a),a.v&&(o.clearTimeout(a.v),a.v=null),io(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function ro(a){if(!gh(a.h)&&!a.m){a.m=!0;var h=a.Ea;te||_(),X||(te(),X=!0),E.add(h,a),a.D=0}}function Jy(a,h){return _h(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=h.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=wi(l(a.Ea,a,h),Bh(a,a.D)),a.D++,!0)}r.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const R=new Gt(this,this.j,a);let P=this.o;if(this.U&&(P?(P=Kl(P),Hl(P,this.U)):P=this.U),this.u!==null||this.R||(R.J=P,P=null),this.S)e:{for(var h=0,d=0;d<this.i.length;d++){t:{var m=this.i[d];if("__data__"in m.map&&(m=m.map.__data__,typeof m=="string")){m=m.length;break t}m=void 0}if(m===void 0)break;if(h+=m,h>4096){h=d;break e}if(h===4096||d===this.i.length-1){h=d+1;break e}}h=1e3}else h=1e3;h=Mh(this,R,h),d=ht(this.J),ue(d,"RID",a),ue(d,"CVER",22),this.G&&ue(d,"X-HTTP-Session-Id",this.G),Oi(this,d),P&&(this.R?h="headers="+Ai(Ph(P))+"&"+h:this.u&&ic(d,this.u,P)),tc(this.h,R),this.Ra&&ue(d,"TYPE","init"),this.S?(ue(d,"$req",h),ue(d,"SID","null"),R.U=!0,Ya(R,d,null)):Ya(R,d,h),this.I=2}}else this.I==3&&(a?xh(this,a):this.i.length==0||gh(this.h)||xh(this))};function xh(a,h){var d;h?d=h.l:d=a.V++;const m=ht(a.J);ue(m,"SID",a.M),ue(m,"RID",d),ue(m,"AID",a.K),Oi(a,m),a.u&&a.o&&ic(m,a.u,a.o),d=new Gt(a,a.j,d,a.D+1),a.u===null&&(d.J=a.o),h&&(a.i=h.G.concat(a.i)),h=Mh(a,d,1e3),d.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),tc(a.h,d),Ya(d,m,h)}function Oi(a,h){a.H&&Ws(a.H,function(d,m){ue(h,m,d)}),a.l&&Ws({},function(d,m){ue(h,m,d)})}function Mh(a,h,d){d=Math.min(a.i.length,d);const m=a.l?l(a.l.Ka,a.l,a):null;e:{var R=a.i;let W=-1;for(;;){const Se=["count="+d];W==-1?d>0?(W=R[0].g,Se.push("ofs="+W)):W=0:Se.push("ofs="+W);let ae=!0;for(let De=0;De<d;De++){var P=R[De].g;const dt=R[De].map;if(P-=W,P<0)W=Math.max(0,R[De].g-100),ae=!1;else try{P="req"+P+"_"||"";try{var L=dt instanceof Map?dt:Object.entries(dt);for(const[Nn,Ht]of L){let Qt=Ht;c(Ht)&&(Qt=Ka(Ht)),Se.push(P+Nn+"="+encodeURIComponent(Qt))}}catch(Nn){throw Se.push(P+"type="+encodeURIComponent("_badmap")),Nn}}catch{m&&m(dt)}}if(ae){L=Se.join("&");break e}}L=void 0}return a=a.i.splice(0,d),h.G=a,L}function Lh(a){if(!a.g&&!a.v){a.Y=1;var h=a.Da;te||_(),X||(te(),X=!0),E.add(h,a),a.A=0}}function oc(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=wi(l(a.Da,a),Bh(a,a.A)),a.A++,!0)}r.Da=function(){if(this.v=null,Fh(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=wi(l(this.Wa,this),a)}},r.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,je(10),no(this),Fh(this))};function ac(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function Fh(a){a.g=new Gt(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var h=ht(a.na);ue(h,"RID","rpc"),ue(h,"SID",a.M),ue(h,"AID",a.K),ue(h,"CI",a.F?"0":"1"),!a.F&&a.ia&&ue(h,"TO",a.ia),ue(h,"TYPE","xmlhttp"),Oi(a,h),a.u&&a.o&&ic(h,a.u,a.o),a.O&&(a.g.H=a.O);var d=a.g;a=a.ba,d.M=1,d.A=Zs(ht(h)),d.u=null,d.R=!0,dh(d,a)}r.Va=function(){this.C!=null&&(this.C=null,no(this),oc(this),je(19))};function io(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function Uh(a,h){var d=null;if(a.g==h){io(a),ac(a),a.g=null;var m=2}else if(ec(a.h,h))d=h.G,yh(a.h,h),m=1;else return;if(a.I!=0){if(h.o)if(m==1){d=h.u?h.u.length:0,h=Date.now()-h.F;var R=a.D;m=Js(),ze(m,new ah(m,d)),ro(a)}else Lh(a);else if(R=h.m,R==3||R==0&&h.X>0||!(m==1&&Jy(a,h)||m==2&&oc(a)))switch(d&&d.length>0&&(h=a.h,h.i=h.i.concat(d)),R){case 1:Vn(a,5);break;case 4:Vn(a,10);break;case 3:Vn(a,6);break;default:Vn(a,2)}}}function Bh(a,h){let d=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(d*=2),d*h}function Vn(a,h){if(a.j.info("Error code "+h),h==2){var d=l(a.bb,a),m=a.Ua;const R=!m;m=new $t(m||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||Si(m,"https"),Zs(m),R?Gy(m.toString(),d):$y(m.toString(),d)}else je(2);a.I=0,a.l&&a.l.pa(h),qh(a),Oh(a)}r.bb=function(a){a?(this.j.info("Successfully pinged google.com"),je(2)):(this.j.info("Failed to ping google.com"),je(1))};function qh(a){if(a.I=0,a.ja=[],a.l){const h=Ih(a.h);(h.length!=0||a.i.length!=0)&&(D(a.ja,h),D(a.ja,a.i),a.h.i.length=0,v(a.i),a.i.length=0),a.l.oa()}}function zh(a,h,d){var m=d instanceof $t?ht(d):new $t(d);if(m.g!="")h&&(m.g=h+"."+m.g),bi(m,m.u);else{var R=o.location;m=R.protocol,h=h?h+"."+R.hostname:R.hostname,R=+R.port;const P=new $t(null);m&&Si(P,m),h&&(P.g=h),R&&bi(P,R),d&&(P.h=d),m=P}return d=a.G,h=a.wa,d&&h&&ue(m,d,h),ue(m,"VER",a.ka),Oi(a,m),m}function jh(a,h,d){if(h&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return h=a.Aa&&!a.ma?new Ie(new rc({ab:d})):new Ie(a.ma),h.Fa(a.L),h}r.isActive=function(){return!!this.l&&this.l.isActive(this)};function Gh(){}r=Gh.prototype,r.ra=function(){},r.qa=function(){},r.pa=function(){},r.oa=function(){},r.isActive=function(){return!0},r.Ka=function(){};function so(){}so.prototype.g=function(a,h){return new Ze(a,h)};function Ze(a,h){Le.call(this),this.g=new Nh(h),this.l=a,this.h=h&&h.messageUrlParams||null,a=h&&h.messageHeaders||null,h&&h.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=h&&h.initMessageHeaders||null,h&&h.messageContentType&&(a?a["X-WebChannel-Content-Type"]=h.messageContentType:a={"X-WebChannel-Content-Type":h.messageContentType}),h&&h.sa&&(a?a["X-WebChannel-Client-Profile"]=h.sa:a={"X-WebChannel-Client-Profile":h.sa}),this.g.U=a,(a=h&&h.Qb)&&!y(a)&&(this.g.u=a),this.A=h&&h.supportsCrossDomainXhr||!1,this.v=h&&h.sendRawJson||!1,(h=h&&h.httpSessionIdParam)&&!y(h)&&(this.g.G=h,a=this.h,a!==null&&h in a&&(a=this.h,h in a&&delete a[h])),this.j=new mr(this)}p(Ze,Le),Ze.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Ze.prototype.close=function(){sc(this.g)},Ze.prototype.o=function(a){var h=this.g;if(typeof a=="string"){var d={};d.__data__=a,a=d}else this.v&&(d={},d.__data__=Ka(a),a=d);h.i.push(new My(h.Ya++,a)),h.I==3&&ro(h)},Ze.prototype.N=function(){this.g.l=null,delete this.j,sc(this.g),delete this.g,Ze.Z.N.call(this)};function $h(a){Wa.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var h=a.__sm__;if(h){e:{for(const d in h){a=d;break e}a=void 0}(this.i=a)&&(a=this.i,h=h!==null&&a in h?h[a]:void 0),this.data=h}else this.data=a}p($h,Wa);function Kh(){Ha.call(this),this.status=1}p(Kh,Ha);function mr(a){this.g=a}p(mr,Gh),mr.prototype.ra=function(){ze(this.g,"a")},mr.prototype.qa=function(a){ze(this.g,new $h(a))},mr.prototype.pa=function(a){ze(this.g,new Kh)},mr.prototype.oa=function(){ze(this.g,"b")},so.prototype.createWebChannel=so.prototype.g,Ze.prototype.send=Ze.prototype.o,Ze.prototype.open=Ze.prototype.m,Ze.prototype.close=Ze.prototype.close,wp=function(){return new so},Tp=function(){return Js()},Ep=Cn,Oc={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Ys.NO_ERROR=0,Ys.TIMEOUT=8,Ys.HTTP_ERROR=6,yo=Ys,ch.COMPLETE="complete",Ip=ch,rh.EventType=Ei,Ei.OPEN="a",Ei.CLOSE="b",Ei.ERROR="c",Ei.MESSAGE="d",Le.prototype.listen=Le.prototype.J,ji=rh,Ie.prototype.listenOnce=Ie.prototype.K,Ie.prototype.getLastError=Ie.prototype.Ha,Ie.prototype.getLastErrorCode=Ie.prototype.ya,Ie.prototype.getStatus=Ie.prototype.ca,Ie.prototype.getResponseJson=Ie.prototype.La,Ie.prototype.getResponseText=Ie.prototype.la,Ie.prototype.send=Ie.prototype.ea,Ie.prototype.setWithCredentials=Ie.prototype.Fa,yp=Ie}).apply(typeof ao<"u"?ao:typeof self<"u"?self:typeof window<"u"?window:{});const id="@firebase/firestore",sd="4.9.2";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ve{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}Ve.UNAUTHENTICATED=new Ve(null),Ve.GOOGLE_CREDENTIALS=new Ve("google-credentials-uid"),Ve.FIRST_PARTY=new Ve("first-party-uid"),Ve.MOCK_USER=new Ve("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ri="12.3.0";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hn=new _u("@firebase/firestore");function wr(){return hn.logLevel}function FE(r){hn.setLogLevel(r)}function N(r,...e){if(hn.logLevel<=J.DEBUG){const t=e.map(Tu);hn.debug(`Firestore (${ri}): ${r}`,...t)}}function Te(r,...e){if(hn.logLevel<=J.ERROR){const t=e.map(Tu);hn.error(`Firestore (${ri}): ${r}`,...t)}}function nt(r,...e){if(hn.logLevel<=J.WARN){const t=e.map(Tu);hn.warn(`Firestore (${ri}): ${r}`,...t)}}function Tu(r){if(typeof r=="string")return r;try{/**
* @license
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/return function(t){return JSON.stringify(t)}(r)}catch{return r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F(r,e,t){let n="Unexpected state";typeof e=="string"?n=e:t=e,vp(r,n,t)}function vp(r,e,t){let n=`FIRESTORE (${ri}) INTERNAL ASSERTION FAILED: ${e} (ID: ${r.toString(16)})`;if(t!==void 0)try{n+=" CONTEXT: "+JSON.stringify(t)}catch{n+=" CONTEXT: "+t}throw Te(n),new Error(n)}function B(r,e,t,n){let i="Unexpected state";typeof t=="string"?i=t:n=t,r||vp(e,i,n)}function UE(r,e){r||F(57014,e)}function M(r,e){return r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class C extends vt{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ne{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ap{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class Rp{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(Ve.UNAUTHENTICATED))}shutdown(){}}class BE{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class qE{constructor(e){this.t=e,this.currentUser=Ve.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){B(this.o===void 0,42304);let n=this.i;const i=u=>this.i!==n?(n=this.i,t(u)):Promise.resolve();let s=new Ne;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new Ne,e.enqueueRetryable(()=>i(this.currentUser))};const o=()=>{const u=s;e.enqueueRetryable(async()=>{await u.promise,await i(this.currentUser)})},c=u=>{N("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit(u=>c(u)),setTimeout(()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?c(u):(N("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new Ne)}},0),o()}getToken(){const e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(n=>this.i!==e?(N("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):n?(B(typeof n.accessToken=="string",31837,{l:n}),new Ap(n.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return B(e===null||typeof e=="string",2055,{h:e}),new Ve(e)}}class zE{constructor(e,t,n){this.P=e,this.T=t,this.I=n,this.type="FirstParty",this.user=Ve.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);const e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class jE{constructor(e,t,n){this.P=e,this.T=t,this.I=n}getToken(){return Promise.resolve(new zE(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(Ve.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class xc{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class GE{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,me(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){B(this.o===void 0,3512);const n=s=>{s.error!=null&&N("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${s.error.message}`);const o=s.token!==this.m;return this.m=s.token,N("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?t(s.token):Promise.resolve()};this.o=s=>{e.enqueueRetryable(()=>n(s))};const i=s=>{N("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=s,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(s=>i(s)),setTimeout(()=>{if(!this.appCheck){const s=this.V.getImmediate({optional:!0});s?i(s):N("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new xc(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(t=>t?(B(typeof t.token=="string",44558,{tokenResult:t}),this.m=t.token,new xc(t.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}class $E{getToken(){return Promise.resolve(new xc(""))}invalidateToken(){}start(e,t){}shutdown(){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function KE(r){const e=typeof self<"u"&&(self.crypto||self.msCrypto),t=new Uint8Array(r);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(t);else for(let n=0;n<r;n++)t[n]=Math.floor(256*Math.random());return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class na{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",t=62*Math.floor(4.129032258064516);let n="";for(;n.length<20;){const i=KE(40);for(let s=0;s<i.length;++s)n.length<20&&i[s]<t&&(n+=e.charAt(i[s]%62))}return n}}function $(r,e){return r<e?-1:r>e?1:0}function Mc(r,e){const t=Math.min(r.length,e.length);for(let n=0;n<t;n++){const i=r.charAt(n),s=e.charAt(n);if(i!==s)return pc(i)===pc(s)?$(i,s):pc(i)?1:-1}return $(r.length,e.length)}const WE=55296,HE=57343;function pc(r){const e=r.charCodeAt(0);return e>=WE&&e<=HE}function Nr(r,e,t){return r.length===e.length&&r.every((n,i)=>t(n,e[i]))}function Sp(r){return r+"\0"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Lc="__name__";class ft{constructor(e,t,n){t===void 0?t=0:t>e.length&&F(637,{offset:t,range:e.length}),n===void 0?n=e.length-t:n>e.length-t&&F(1746,{length:n,range:e.length-t}),this.segments=e,this.offset=t,this.len=n}get length(){return this.len}isEqual(e){return ft.comparator(this,e)===0}child(e){const t=this.segments.slice(this.offset,this.limit());return e instanceof ft?e.forEach(n=>{t.push(n)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,n=this.limit();t<n;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){const n=Math.min(e.length,t.length);for(let i=0;i<n;i++){const s=ft.compareSegments(e.get(i),t.get(i));if(s!==0)return s}return $(e.length,t.length)}static compareSegments(e,t){const n=ft.isNumericId(e),i=ft.isNumericId(t);return n&&!i?-1:!n&&i?1:n&&i?ft.extractNumericId(e).compare(ft.extractNumericId(t)):Mc(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return on.fromString(e.substring(4,e.length-2))}}class H extends ft{construct(e,t,n){return new H(e,t,n)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const t=[];for(const n of e){if(n.indexOf("//")>=0)throw new C(S.INVALID_ARGUMENT,`Invalid segment (${n}). Paths must not contain // in them.`);t.push(...n.split("/").filter(i=>i.length>0))}return new H(t)}static emptyPath(){return new H([])}}const QE=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class he extends ft{construct(e,t,n){return new he(e,t,n)}static isValidIdentifier(e){return QE.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),he.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Lc}static keyField(){return new he([Lc])}static fromServerFormat(e){const t=[];let n="",i=0;const s=()=>{if(n.length===0)throw new C(S.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(n),n=""};let o=!1;for(;i<e.length;){const c=e[i];if(c==="\\"){if(i+1===e.length)throw new C(S.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[i+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new C(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);n+=u,i+=2}else c==="`"?(o=!o,i++):c!=="."||o?(n+=c,i++):(s(),i++)}if(s(),o)throw new C(S.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new he(t)}static emptyPath(){return new he([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class x{constructor(e){this.path=e}static fromPath(e){return new x(H.fromString(e))}static fromName(e){return new x(H.fromString(e).popFirst(5))}static empty(){return new x(H.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&H.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,t){return H.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new x(new H(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wu(r,e,t){if(!t)throw new C(S.INVALID_ARGUMENT,`Function ${r}() cannot be called with an empty ${e}.`)}function bp(r,e,t,n){if(e===!0&&n===!0)throw new C(S.INVALID_ARGUMENT,`${r} and ${t} cannot be used together.`)}function od(r){if(!x.isDocumentKey(r))throw new C(S.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${r} has ${r.length}.`)}function ad(r){if(x.isDocumentKey(r))throw new C(S.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${r} has ${r.length}.`)}function Pp(r){return typeof r=="object"&&r!==null&&(Object.getPrototypeOf(r)===Object.prototype||Object.getPrototypeOf(r)===null)}function ra(r){if(r===void 0)return"undefined";if(r===null)return"null";if(typeof r=="string")return r.length>20&&(r=`${r.substring(0,20)}...`),JSON.stringify(r);if(typeof r=="number"||typeof r=="boolean")return""+r;if(typeof r=="object"){if(r instanceof Array)return"an array";{const e=function(n){return n.constructor?n.constructor.name:null}(r);return e?`a custom ${e} object`:"an object"}}return typeof r=="function"?"a function":F(12329,{type:typeof r})}function Q(r,e){if("_delegate"in r&&(r=r._delegate),!(r instanceof e)){if(e.name===r.constructor.name)throw new C(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const t=ra(r);throw new C(S.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${t}`)}}return r}function Cp(r,e){if(e<=0)throw new C(S.INVALID_ARGUMENT,`Function ${r}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Re(r,e){const t={typeString:r};return e&&(t.value=e),t}function ar(r,e){if(!Pp(r))throw new C(S.INVALID_ARGUMENT,"JSON must be an object");let t;for(const n in e)if(e[n]){const i=e[n].typeString,s="value"in e[n]?{value:e[n].value}:void 0;if(!(n in r)){t=`JSON missing required field: '${n}'`;break}const o=r[n];if(i&&typeof o!==i){t=`JSON field '${n}' must be a ${i}.`;break}if(s!==void 0&&o!==s.value){t=`Expected '${n}' field to equal '${s.value}'`;break}}if(t)throw new C(S.INVALID_ARGUMENT,t);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cd=-62135596800,ud=1e6;class ne{static now(){return ne.fromMillis(Date.now())}static fromDate(e){return ne.fromMillis(e.getTime())}static fromMillis(e){const t=Math.floor(e/1e3),n=Math.floor((e-1e3*t)*ud);return new ne(t,n)}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0)throw new C(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(t>=1e9)throw new C(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<cd)throw new C(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new C(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/ud}_compareTo(e){return this.seconds===e.seconds?$(this.nanoseconds,e.nanoseconds):$(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:ne._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(ar(e,ne._jsonSchema))return new ne(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-cd;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}ne._jsonSchemaVersion="firestore/timestamp/1.0",ne._jsonSchema={type:Re("string",ne._jsonSchemaVersion),seconds:Re("number"),nanoseconds:Re("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{static fromTimestamp(e){return new j(e)}static min(){return new j(new ne(0,0))}static max(){return new j(new ne(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Or=-1;class xr{constructor(e,t,n,i){this.indexId=e,this.collectionGroup=t,this.fields=n,this.indexState=i}}function Fc(r){return r.fields.find(e=>e.kind===2)}function Mn(r){return r.fields.filter(e=>e.kind!==2)}function JE(r,e){let t=$(r.collectionGroup,e.collectionGroup);if(t!==0)return t;for(let n=0;n<Math.min(r.fields.length,e.fields.length);++n)if(t=YE(r.fields[n],e.fields[n]),t!==0)return t;return $(r.fields.length,e.fields.length)}xr.UNKNOWN_ID=-1;class Gn{constructor(e,t){this.fieldPath=e,this.kind=t}}function YE(r,e){const t=he.comparator(r.fieldPath,e.fieldPath);return t!==0?t:$(r.kind,e.kind)}class Mr{constructor(e,t){this.sequenceNumber=e,this.offset=t}static empty(){return new Mr(0,rt.min())}}function Dp(r,e){const t=r.toTimestamp().seconds,n=r.toTimestamp().nanoseconds+1,i=j.fromTimestamp(n===1e9?new ne(t+1,0):new ne(t,n));return new rt(i,x.empty(),e)}function kp(r){return new rt(r.readTime,r.key,Or)}class rt{constructor(e,t,n){this.readTime=e,this.documentKey=t,this.largestBatchId=n}static min(){return new rt(j.min(),x.empty(),Or)}static max(){return new rt(j.max(),x.empty(),Or)}}function vu(r,e){let t=r.readTime.compareTo(e.readTime);return t!==0?t:(t=x.comparator(r.documentKey,e.documentKey),t!==0?t:$(r.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vp="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class Np{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function In(r){if(r.code!==S.FAILED_PRECONDITION||r.message!==Vp)throw r;N("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(t=>{this.isDone=!0,this.result=t,this.nextCallback&&this.nextCallback(t)},t=>{this.isDone=!0,this.error=t,this.catchCallback&&this.catchCallback(t)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&F(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new A((n,i)=>{this.nextCallback=s=>{this.wrapSuccess(e,s).next(n,i)},this.catchCallback=s=>{this.wrapFailure(t,s).next(n,i)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{const t=e();return t instanceof A?t:A.resolve(t)}catch(t){return A.reject(t)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):A.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):A.reject(t)}static resolve(e){return new A((t,n)=>{t(e)})}static reject(e){return new A((t,n)=>{n(e)})}static waitFor(e){return new A((t,n)=>{let i=0,s=0,o=!1;e.forEach(c=>{++i,c.next(()=>{++s,o&&s===i&&t()},u=>n(u))}),o=!0,s===i&&t()})}static or(e){let t=A.resolve(!1);for(const n of e)t=t.next(i=>i?A.resolve(i):n());return t}static forEach(e,t){const n=[];return e.forEach((i,s)=>{n.push(t.call(this,i,s))}),this.waitFor(n)}static mapArray(e,t){return new A((n,i)=>{const s=e.length,o=new Array(s);let c=0;for(let u=0;u<s;u++){const l=u;t(e[l]).next(f=>{o[l]=f,++c,c===s&&n(o)},f=>i(f))}})}static doWhile(e,t){return new A((n,i)=>{const s=()=>{e()===!0?t().next(()=>{s()},i):n()};s()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const et="SimpleDb";class ia{static open(e,t,n,i){try{return new ia(t,e.transaction(i,n))}catch(s){throw new Qi(t,s)}}constructor(e,t){this.action=e,this.transaction=t,this.aborted=!1,this.S=new Ne,this.transaction.oncomplete=()=>{this.S.resolve()},this.transaction.onabort=()=>{t.error?this.S.reject(new Qi(e,t.error)):this.S.resolve()},this.transaction.onerror=n=>{const i=Au(n.target.error);this.S.reject(new Qi(e,i))}}get D(){return this.S.promise}abort(e){e&&this.S.reject(e),this.aborted||(N(et,"Aborting transaction:",e?e.message:"Client-initiated abort"),this.aborted=!0,this.transaction.abort())}C(){const e=this.transaction;this.aborted||typeof e.commit!="function"||e.commit()}store(e){const t=this.transaction.objectStore(e);return new ZE(t)}}class It{static delete(e){return N(et,"Removing database:",e),Fn(Yf().indexedDB.deleteDatabase(e)).toPromise()}static v(){if(!sp())return!1;if(It.F())return!0;const e=be(),t=It.M(e),n=0<t&&t<10,i=Op(e),s=0<i&&i<4.5;return!(e.indexOf("MSIE ")>0||e.indexOf("Trident/")>0||e.indexOf("Edge/")>0||n||s)}static F(){return typeof process<"u"&&process.__PRIVATE_env?.__PRIVATE_USE_MOCK_PERSISTENCE==="YES"}static O(e,t){return e.store(t)}static M(e){const t=e.match(/i(?:phone|pad|pod) os ([\d_]+)/i),n=t?t[1].split("_").slice(0,2).join("."):"-1";return Number(n)}constructor(e,t,n){this.name=e,this.version=t,this.N=n,this.B=null,It.M(be())===12.2&&Te("Firestore persistence suffers from a bug in iOS 12.2 Safari that may cause your app to stop working. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.")}async L(e){return this.db||(N(et,"Opening database:",this.name),this.db=await new Promise((t,n)=>{const i=indexedDB.open(this.name,this.version);i.onsuccess=s=>{const o=s.target.result;t(o)},i.onblocked=()=>{n(new Qi(e,"Cannot upgrade IndexedDB schema while another tab is open. Close all tabs that access Firestore and reload this page to proceed."))},i.onerror=s=>{const o=s.target.error;o.name==="VersionError"?n(new C(S.FAILED_PRECONDITION,"A newer version of the Firestore SDK was previously used and so the persisted data is not compatible with the version of the SDK you are now using. The SDK will operate with persistence disabled. If you need persistence, please re-upgrade to a newer version of the SDK or else clear the persisted IndexedDB data for your app to start fresh.")):o.name==="InvalidStateError"?n(new C(S.FAILED_PRECONDITION,"Unable to open an IndexedDB connection. This could be due to running in a private browsing session on a browser whose private browsing sessions do not support IndexedDB: "+o)):n(new Qi(e,o))},i.onupgradeneeded=s=>{N(et,'Database "'+this.name+'" requires upgrade from version:',s.oldVersion);const o=s.target.result;this.N.k(o,i.transaction,s.oldVersion,this.version).next(()=>{N(et,"Database upgrade to version "+this.version+" complete")})}})),this.q&&(this.db.onversionchange=t=>this.q(t)),this.db}$(e){this.q=e,this.db&&(this.db.onversionchange=t=>e(t))}async runTransaction(e,t,n,i){const s=t==="readonly";let o=0;for(;;){++o;try{this.db=await this.L(e);const c=ia.open(this.db,e,s?"readonly":"readwrite",n),u=i(c).next(l=>(c.C(),l)).catch(l=>(c.abort(l),A.reject(l))).toPromise();return u.catch(()=>{}),await c.D,u}catch(c){const u=c,l=u.name!=="FirebaseError"&&o<3;if(N(et,"Transaction failed with error:",u.message,"Retrying:",l),this.close(),!l)return Promise.reject(u)}}}close(){this.db&&this.db.close(),this.db=void 0}}function Op(r){const e=r.match(/Android ([\d.]+)/i),t=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(t)}class XE{constructor(e){this.U=e,this.K=!1,this.W=null}get isDone(){return this.K}get G(){return this.W}set cursor(e){this.U=e}done(){this.K=!0}j(e){this.W=e}delete(){return Fn(this.U.delete())}}class Qi extends C{constructor(e,t){super(S.UNAVAILABLE,`IndexedDB transaction '${e}' failed: ${t}`),this.name="IndexedDbTransactionError"}}function En(r){return r.name==="IndexedDbTransactionError"}class ZE{constructor(e){this.store=e}put(e,t){let n;return t!==void 0?(N(et,"PUT",this.store.name,e,t),n=this.store.put(t,e)):(N(et,"PUT",this.store.name,"<auto-key>",e),n=this.store.put(e)),Fn(n)}add(e){return N(et,"ADD",this.store.name,e,e),Fn(this.store.add(e))}get(e){return Fn(this.store.get(e)).next(t=>(t===void 0&&(t=null),N(et,"GET",this.store.name,e,t),t))}delete(e){return N(et,"DELETE",this.store.name,e),Fn(this.store.delete(e))}count(){return N(et,"COUNT",this.store.name),Fn(this.store.count())}J(e,t){const n=this.options(e,t),i=n.index?this.store.index(n.index):this.store;if(typeof i.getAll=="function"){const s=i.getAll(n.range);return new A((o,c)=>{s.onerror=u=>{c(u.target.error)},s.onsuccess=u=>{o(u.target.result)}})}{const s=this.cursor(n),o=[];return this.H(s,(c,u)=>{o.push(u)}).next(()=>o)}}Y(e,t){const n=this.store.getAll(e,t===null?void 0:t);return new A((i,s)=>{n.onerror=o=>{s(o.target.error)},n.onsuccess=o=>{i(o.target.result)}})}Z(e,t){N(et,"DELETE ALL",this.store.name);const n=this.options(e,t);n.X=!1;const i=this.cursor(n);return this.H(i,(s,o,c)=>c.delete())}ee(e,t){let n;t?n=e:(n={},t=e);const i=this.cursor(n);return this.H(i,t)}te(e){const t=this.cursor({});return new A((n,i)=>{t.onerror=s=>{const o=Au(s.target.error);i(o)},t.onsuccess=s=>{const o=s.target.result;o?e(o.primaryKey,o.value).next(c=>{c?o.continue():n()}):n()}})}H(e,t){const n=[];return new A((i,s)=>{e.onerror=o=>{s(o.target.error)},e.onsuccess=o=>{const c=o.target.result;if(!c)return void i();const u=new XE(c),l=t(c.primaryKey,c.value,u);if(l instanceof A){const f=l.catch(p=>(u.done(),A.reject(p)));n.push(f)}u.isDone?i():u.G===null?c.continue():c.continue(u.G)}}).next(()=>A.waitFor(n))}options(e,t){let n;return e!==void 0&&(typeof e=="string"?n=e:t=e),{index:n,range:t}}cursor(e){let t="next";if(e.reverse&&(t="prev"),e.index){const n=this.store.index(e.index);return e.X?n.openKeyCursor(e.range,t):n.openCursor(e.range,t)}return this.store.openCursor(e.range,t)}}function Fn(r){return new A((e,t)=>{r.onsuccess=n=>{const i=n.target.result;e(i)},r.onerror=n=>{const i=Au(n.target.error);t(i)}})}let ld=!1;function Au(r){const e=It.M(be());if(e>=12.2&&e<13){const t="An internal error was encountered in the Indexed Database server";if(r.message.indexOf(t)>=0){const n=new C("internal",`IOS_INDEXEDDB_BUG1: IndexedDb has thrown '${t}'. This is likely due to an unavoidable bug in iOS. See https://stackoverflow.com/q/56496296/110915 for details and a potential workaround.`);return ld||(ld=!0,setTimeout(()=>{throw n},0)),n}}return r}const Ji="IndexBackfiller";class eT{constructor(e,t){this.asyncQueue=e,this.ne=t,this.task=null}start(){this.re(15e3)}stop(){this.task&&(this.task.cancel(),this.task=null)}get started(){return this.task!==null}re(e){N(Ji,`Scheduled in ${e}ms`),this.task=this.asyncQueue.enqueueAfterDelay("index_backfill",e,async()=>{this.task=null;try{const t=await this.ne.ie();N(Ji,`Documents written: ${t}`)}catch(t){En(t)?N(Ji,"Ignoring IndexedDB error during index backfill: ",t):await In(t)}await this.re(6e4)})}}class tT{constructor(e,t){this.localStore=e,this.persistence=t}async ie(e=50){return this.persistence.runTransaction("Backfill Indexes","readwrite-primary",t=>this.se(t,e))}se(e,t){const n=new Set;let i=t,s=!0;return A.doWhile(()=>s===!0&&i>0,()=>this.localStore.indexManager.getNextCollectionGroupToUpdate(e).next(o=>{if(o!==null&&!n.has(o))return N(Ji,`Processing collection: ${o}`),this.oe(e,o,i).next(c=>{i-=c,n.add(o)});s=!1})).next(()=>t-i)}oe(e,t,n){return this.localStore.indexManager.getMinOffsetFromCollectionGroup(e,t).next(i=>this.localStore.localDocuments.getNextDocuments(e,t,i,n).next(s=>{const o=s.changes;return this.localStore.indexManager.updateIndexEntries(e,o).next(()=>this._e(i,s)).next(c=>(N(Ji,`Updating offset: ${c}`),this.localStore.indexManager.updateCollectionGroup(e,t,c))).next(()=>o.size)}))}_e(e,t){let n=e;return t.changes.forEach((i,s)=>{const o=kp(s);vu(o,n)>0&&(n=o)}),new rt(n.readTime,n.documentKey,Math.max(t.batchId,e.largestBatchId))}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class We{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=n=>this.ae(n),this.ue=n=>t.writeSequenceNumber(n))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}We.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const an=-1;function Ps(r){return r==null}function ls(r){return r===0&&1/r==-1/0}function xp(r){return typeof r=="number"&&Number.isInteger(r)&&!ls(r)&&r<=Number.MAX_SAFE_INTEGER&&r>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oo="";function Be(r){let e="";for(let t=0;t<r.length;t++)e.length>0&&(e=hd(e)),e=nT(r.get(t),e);return hd(e)}function nT(r,e){let t=e;const n=r.length;for(let i=0;i<n;i++){const s=r.charAt(i);switch(s){case"\0":t+="";break;case Oo:t+="";break;default:t+=s}}return t}function hd(r){return r+Oo+""}function mt(r){const e=r.length;if(B(e>=2,64408,{path:r}),e===2)return B(r.charAt(0)===Oo&&r.charAt(1)==="",56145,{path:r}),H.emptyPath();const t=e-2,n=[];let i="";for(let s=0;s<e;){const o=r.indexOf(Oo,s);switch((o<0||o>t)&&F(50515,{path:r}),r.charAt(o+1)){case"":const c=r.substring(s,o);let u;i.length===0?u=c:(i+=c,u=i,i=""),n.push(u);break;case"":i+=r.substring(s,o),i+="\0";break;case"":i+=r.substring(s,o+1);break;default:F(61167,{path:r})}s=o+2}return new H(n)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ln="remoteDocuments",Cs="owner",gr="owner",hs="mutationQueues",rT="userId",ot="mutations",dd="batchId",zn="userMutationsIndex",fd=["userId","batchId"];/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Io(r,e){return[r,Be(e)]}function Mp(r,e,t){return[r,Be(e),t]}const iT={},Lr="documentMutations",xo="remoteDocumentsV14",sT=["prefixPath","collectionGroup","readTime","documentId"],Eo="documentKeyIndex",oT=["prefixPath","collectionGroup","documentId"],Lp="collectionGroupIndex",aT=["collectionGroup","readTime","prefixPath","documentId"],ds="remoteDocumentGlobal",Uc="remoteDocumentGlobalKey",Fr="targets",Fp="queryTargetsIndex",cT=["canonicalId","targetId"],Ur="targetDocuments",uT=["targetId","path"],Ru="documentTargetsIndex",lT=["path","targetId"],Mo="targetGlobalKey",$n="targetGlobal",fs="collectionParents",hT=["collectionId","parent"],Br="clientMetadata",dT="clientId",sa="bundles",fT="bundleId",oa="namedQueries",pT="name",Su="indexConfiguration",mT="indexId",Bc="collectionGroupIndex",gT="collectionGroup",Yi="indexState",_T=["indexId","uid"],Up="sequenceNumberIndex",yT=["uid","sequenceNumber"],Xi="indexEntries",IT=["indexId","uid","arrayValue","directionalValue","orderedDocumentKey","documentKey"],Bp="documentKeyIndex",ET=["indexId","uid","orderedDocumentKey"],aa="documentOverlays",TT=["userId","collectionPath","documentId"],qc="collectionPathOverlayIndex",wT=["userId","collectionPath","largestBatchId"],qp="collectionGroupOverlayIndex",vT=["userId","collectionGroup","largestBatchId"],bu="globals",AT="name",zp=[hs,ot,Lr,Ln,Fr,Cs,$n,Ur,Br,ds,fs,sa,oa],RT=[...zp,aa],jp=[hs,ot,Lr,xo,Fr,Cs,$n,Ur,Br,ds,fs,sa,oa,aa],Gp=jp,Pu=[...Gp,Su,Yi,Xi],ST=Pu,$p=[...Pu,bu],bT=$p;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zc extends Np{constructor(e,t){super(),this.le=e,this.currentSequenceNumber=t}}function Ce(r,e){const t=M(r);return It.O(t.le,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pd(r){let e=0;for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e++;return e}function Tn(r,e){for(const t in r)Object.prototype.hasOwnProperty.call(r,t)&&e(t,r[t])}function Kp(r,e){const t=[];for(const n in r)Object.prototype.hasOwnProperty.call(r,n)&&t.push(e(r[n],n,r));return t}function Wp(r){for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ce{constructor(e,t){this.comparator=e,this.root=t||xe.EMPTY}insert(e,t){return new ce(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,xe.BLACK,null,null))}remove(e){return new ce(this.comparator,this.root.remove(e,this.comparator).copy(null,null,xe.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){const n=this.comparator(e,t.key);if(n===0)return t.value;n<0?t=t.left:n>0&&(t=t.right)}return null}indexOf(e){let t=0,n=this.root;for(;!n.isEmpty();){const i=this.comparator(e,n.key);if(i===0)return t+n.left.size;i<0?n=n.left:(t+=n.left.size+1,n=n.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,n)=>(e(t,n),!1))}toString(){const e=[];return this.inorderTraversal((t,n)=>(e.push(`${t}:${n}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new co(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new co(this.root,e,this.comparator,!1)}getReverseIterator(){return new co(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new co(this.root,e,this.comparator,!0)}}class co{constructor(e,t,n,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=t?n(e.key,t):1,t&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(s===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class xe{constructor(e,t,n,i,s){this.key=e,this.value=t,this.color=n??xe.RED,this.left=i??xe.EMPTY,this.right=s??xe.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,n,i,s){return new xe(e??this.key,t??this.value,n??this.color,i??this.left,s??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let i=this;const s=n(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,n),null):s===0?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.fixUp()}removeMin(){if(this.left.isEmpty())return xe.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,t){let n,i=this;if(t(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),t(e,i.key)===0){if(i.right.isEmpty())return xe.EMPTY;n=i.right.min(),i=i.copy(n.key,n.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,xe.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,xe.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw F(43730,{key:this.key,value:this.value});if(this.right.isRed())throw F(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw F(27949);return e+(this.isRed()?0:1)}}xe.EMPTY=null,xe.RED=!0,xe.BLACK=!1;xe.EMPTY=new class{constructor(){this.size=0}get key(){throw F(57766)}get value(){throw F(16141)}get color(){throw F(16727)}get left(){throw F(29726)}get right(){throw F(36894)}copy(e,t,n,i,s){return this}insert(e,t,n){return new xe(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class se{constructor(e){this.comparator=e,this.data=new ce(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,n)=>(e(t),!1))}forEachInRange(e,t){const n=this.data.getIteratorFrom(e[0]);for(;n.hasNext();){const i=n.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let n;for(n=t!==void 0?this.data.getIteratorFrom(t):this.data.getIterator();n.hasNext();)if(!e(n.getNext().key))return}firstAfterOrEqual(e){const t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new md(this.data.getIterator())}getIteratorFrom(e){return new md(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(n=>{t=t.add(n)}),t}isEqual(e){if(!(e instanceof se)||this.size!==e.size)return!1;const t=this.data.getIterator(),n=e.data.getIterator();for(;t.hasNext();){const i=t.getNext().key,s=n.getNext().key;if(this.comparator(i,s)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(t=>{e.push(t)}),e}toString(){const e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){const t=new se(this.comparator);return t.data=e,t}}class md{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}function _r(r){return r.hasNext()?r.getNext():void 0}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class He{constructor(e){this.fields=e,e.sort(he.comparator)}static empty(){return new He([])}unionWith(e){let t=new se(he.comparator);for(const n of this.fields)t=t.add(n);for(const n of e)t=t.add(n);return new He(t.toArray())}covers(e){for(const t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return Nr(this.fields,e.fields,(t,n)=>t.isEqual(n))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hp extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function PT(){return typeof atob<"u"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ye{constructor(e){this.binaryString=e}static fromBase64String(e){const t=function(i){try{return atob(i)}catch(s){throw typeof DOMException<"u"&&s instanceof DOMException?new Hp("Invalid base64 string: "+s):s}}(e);return new ye(t)}static fromUint8Array(e){const t=function(i){let s="";for(let o=0;o<i.length;++o)s+=String.fromCharCode(i[o]);return s}(e);return new ye(t)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(t){return btoa(t)}(this.binaryString)}toUint8Array(){return function(t){const n=new Uint8Array(t.length);for(let i=0;i<t.length;i++)n[i]=t.charCodeAt(i);return n}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return $(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}ye.EMPTY_BYTE_STRING=new ye("");const CT=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Ot(r){if(B(!!r,39018),typeof r=="string"){let e=0;const t=CT.exec(r);if(B(!!t,46558,{timestamp:r}),t[1]){let i=t[1];i=(i+"000000000").substr(0,9),e=Number(i)}const n=new Date(r);return{seconds:Math.floor(n.getTime()/1e3),nanos:e}}return{seconds:pe(r.seconds),nanos:pe(r.nanos)}}function pe(r){return typeof r=="number"?r:typeof r=="string"?Number(r):0}function xt(r){return typeof r=="string"?ye.fromBase64String(r):ye.fromUint8Array(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qp="server_timestamp",Jp="__type__",Yp="__previous_value__",Xp="__local_write_time__";function ca(r){return(r?.mapValue?.fields||{})[Jp]?.stringValue===Qp}function ua(r){const e=r.mapValue.fields[Yp];return ca(e)?ua(e):e}function ps(r){const e=Ot(r.mapValue.fields[Xp].timestampValue);return new ne(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class DT{constructor(e,t,n,i,s,o,c,u,l,f){this.databaseId=e,this.appId=t,this.persistenceKey=n,this.host=i,this.ssl=s,this.forceLongPolling=o,this.autoDetectLongPolling=c,this.longPollingOptions=u,this.useFetchStreams=l,this.isUsingEmulator=f}}const ms="(default)";class dn{constructor(e,t){this.projectId=e,this.database=t||ms}static empty(){return new dn("","")}get isDefaultDatabase(){return this.database===ms}isEqual(e){return e instanceof dn&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cu="__type__",Zp="__max__",nn={mapValue:{fields:{__type__:{stringValue:Zp}}}},Du="__vector__",qr="value",To={nullValue:"NULL_VALUE"};function fn(r){return"nullValue"in r?0:"booleanValue"in r?1:"integerValue"in r||"doubleValue"in r?2:"timestampValue"in r?3:"stringValue"in r?5:"bytesValue"in r?6:"referenceValue"in r?7:"geoPointValue"in r?8:"arrayValue"in r?9:"mapValue"in r?ca(r)?4:em(r)?9007199254740991:la(r)?10:11:F(28295,{value:r})}function Tt(r,e){if(r===e)return!0;const t=fn(r);if(t!==fn(e))return!1;switch(t){case 0:case 9007199254740991:return!0;case 1:return r.booleanValue===e.booleanValue;case 4:return ps(r).isEqual(ps(e));case 3:return function(i,s){if(typeof i.timestampValue=="string"&&typeof s.timestampValue=="string"&&i.timestampValue.length===s.timestampValue.length)return i.timestampValue===s.timestampValue;const o=Ot(i.timestampValue),c=Ot(s.timestampValue);return o.seconds===c.seconds&&o.nanos===c.nanos}(r,e);case 5:return r.stringValue===e.stringValue;case 6:return function(i,s){return xt(i.bytesValue).isEqual(xt(s.bytesValue))}(r,e);case 7:return r.referenceValue===e.referenceValue;case 8:return function(i,s){return pe(i.geoPointValue.latitude)===pe(s.geoPointValue.latitude)&&pe(i.geoPointValue.longitude)===pe(s.geoPointValue.longitude)}(r,e);case 2:return function(i,s){if("integerValue"in i&&"integerValue"in s)return pe(i.integerValue)===pe(s.integerValue);if("doubleValue"in i&&"doubleValue"in s){const o=pe(i.doubleValue),c=pe(s.doubleValue);return o===c?ls(o)===ls(c):isNaN(o)&&isNaN(c)}return!1}(r,e);case 9:return Nr(r.arrayValue.values||[],e.arrayValue.values||[],Tt);case 10:case 11:return function(i,s){const o=i.mapValue.fields||{},c=s.mapValue.fields||{};if(pd(o)!==pd(c))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(c[u]===void 0||!Tt(o[u],c[u])))return!1;return!0}(r,e);default:return F(52216,{left:r})}}function gs(r,e){return(r.values||[]).find(t=>Tt(t,e))!==void 0}function pn(r,e){if(r===e)return 0;const t=fn(r),n=fn(e);if(t!==n)return $(t,n);switch(t){case 0:case 9007199254740991:return 0;case 1:return $(r.booleanValue,e.booleanValue);case 2:return function(s,o){const c=pe(s.integerValue||s.doubleValue),u=pe(o.integerValue||o.doubleValue);return c<u?-1:c>u?1:c===u?0:isNaN(c)?isNaN(u)?0:-1:1}(r,e);case 3:return gd(r.timestampValue,e.timestampValue);case 4:return gd(ps(r),ps(e));case 5:return Mc(r.stringValue,e.stringValue);case 6:return function(s,o){const c=xt(s),u=xt(o);return c.compareTo(u)}(r.bytesValue,e.bytesValue);case 7:return function(s,o){const c=s.split("/"),u=o.split("/");for(let l=0;l<c.length&&l<u.length;l++){const f=$(c[l],u[l]);if(f!==0)return f}return $(c.length,u.length)}(r.referenceValue,e.referenceValue);case 8:return function(s,o){const c=$(pe(s.latitude),pe(o.latitude));return c!==0?c:$(pe(s.longitude),pe(o.longitude))}(r.geoPointValue,e.geoPointValue);case 9:return _d(r.arrayValue,e.arrayValue);case 10:return function(s,o){const c=s.fields||{},u=o.fields||{},l=c[qr]?.arrayValue,f=u[qr]?.arrayValue,p=$(l?.values?.length||0,f?.values?.length||0);return p!==0?p:_d(l,f)}(r.mapValue,e.mapValue);case 11:return function(s,o){if(s===nn.mapValue&&o===nn.mapValue)return 0;if(s===nn.mapValue)return 1;if(o===nn.mapValue)return-1;const c=s.fields||{},u=Object.keys(c),l=o.fields||{},f=Object.keys(l);u.sort(),f.sort();for(let p=0;p<u.length&&p<f.length;++p){const g=Mc(u[p],f[p]);if(g!==0)return g;const v=pn(c[u[p]],l[f[p]]);if(v!==0)return v}return $(u.length,f.length)}(r.mapValue,e.mapValue);default:throw F(23264,{he:t})}}function gd(r,e){if(typeof r=="string"&&typeof e=="string"&&r.length===e.length)return $(r,e);const t=Ot(r),n=Ot(e),i=$(t.seconds,n.seconds);return i!==0?i:$(t.nanos,n.nanos)}function _d(r,e){const t=r.values||[],n=e.values||[];for(let i=0;i<t.length&&i<n.length;++i){const s=pn(t[i],n[i]);if(s)return s}return $(t.length,n.length)}function zr(r){return jc(r)}function jc(r){return"nullValue"in r?"null":"booleanValue"in r?""+r.booleanValue:"integerValue"in r?""+r.integerValue:"doubleValue"in r?""+r.doubleValue:"timestampValue"in r?function(t){const n=Ot(t);return`time(${n.seconds},${n.nanos})`}(r.timestampValue):"stringValue"in r?r.stringValue:"bytesValue"in r?function(t){return xt(t).toBase64()}(r.bytesValue):"referenceValue"in r?function(t){return x.fromName(t).toString()}(r.referenceValue):"geoPointValue"in r?function(t){return`geo(${t.latitude},${t.longitude})`}(r.geoPointValue):"arrayValue"in r?function(t){let n="[",i=!0;for(const s of t.values||[])i?i=!1:n+=",",n+=jc(s);return n+"]"}(r.arrayValue):"mapValue"in r?function(t){const n=Object.keys(t.fields||{}).sort();let i="{",s=!0;for(const o of n)s?s=!1:i+=",",i+=`${o}:${jc(t.fields[o])}`;return i+"}"}(r.mapValue):F(61005,{value:r})}function wo(r){switch(fn(r)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=ua(r);return e?16+wo(e):16;case 5:return 2*r.stringValue.length;case 6:return xt(r.bytesValue).approximateByteSize();case 7:return r.referenceValue.length;case 9:return function(n){return(n.values||[]).reduce((i,s)=>i+wo(s),0)}(r.arrayValue);case 10:case 11:return function(n){let i=0;return Tn(n.fields,(s,o)=>{i+=s.length+wo(o)}),i}(r.mapValue);default:throw F(13486,{value:r})}}function Jn(r,e){return{referenceValue:`projects/${r.projectId}/databases/${r.database}/documents/${e.path.canonicalString()}`}}function Gc(r){return!!r&&"integerValue"in r}function _s(r){return!!r&&"arrayValue"in r}function yd(r){return!!r&&"nullValue"in r}function Id(r){return!!r&&"doubleValue"in r&&isNaN(Number(r.doubleValue))}function vo(r){return!!r&&"mapValue"in r}function la(r){return(r?.mapValue?.fields||{})[Cu]?.stringValue===Du}function Zi(r){if(r.geoPointValue)return{geoPointValue:{...r.geoPointValue}};if(r.timestampValue&&typeof r.timestampValue=="object")return{timestampValue:{...r.timestampValue}};if(r.mapValue){const e={mapValue:{fields:{}}};return Tn(r.mapValue.fields,(t,n)=>e.mapValue.fields[t]=Zi(n)),e}if(r.arrayValue){const e={arrayValue:{values:[]}};for(let t=0;t<(r.arrayValue.values||[]).length;++t)e.arrayValue.values[t]=Zi(r.arrayValue.values[t]);return e}return{...r}}function em(r){return(((r.mapValue||{}).fields||{}).__type__||{}).stringValue===Zp}const tm={mapValue:{fields:{[Cu]:{stringValue:Du},[qr]:{arrayValue:{}}}}};function kT(r){return"nullValue"in r?To:"booleanValue"in r?{booleanValue:!1}:"integerValue"in r||"doubleValue"in r?{doubleValue:NaN}:"timestampValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"stringValue"in r?{stringValue:""}:"bytesValue"in r?{bytesValue:""}:"referenceValue"in r?Jn(dn.empty(),x.empty()):"geoPointValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"arrayValue"in r?{arrayValue:{}}:"mapValue"in r?la(r)?tm:{mapValue:{}}:F(35942,{value:r})}function VT(r){return"nullValue"in r?{booleanValue:!1}:"booleanValue"in r?{doubleValue:NaN}:"integerValue"in r||"doubleValue"in r?{timestampValue:{seconds:Number.MIN_SAFE_INTEGER}}:"timestampValue"in r?{stringValue:""}:"stringValue"in r?{bytesValue:""}:"bytesValue"in r?Jn(dn.empty(),x.empty()):"referenceValue"in r?{geoPointValue:{latitude:-90,longitude:-180}}:"geoPointValue"in r?{arrayValue:{}}:"arrayValue"in r?tm:"mapValue"in r?la(r)?{mapValue:{}}:nn:F(61959,{value:r})}function Ed(r,e){const t=pn(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?-1:!r.inclusive&&e.inclusive?1:0}function Td(r,e){const t=pn(r.value,e.value);return t!==0?t:r.inclusive&&!e.inclusive?1:!r.inclusive&&e.inclusive?-1:0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{constructor(e){this.value=e}static empty(){return new Me({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let n=0;n<e.length-1;++n)if(t=(t.mapValue.fields||{})[e.get(n)],!vo(t))return null;return t=(t.mapValue.fields||{})[e.lastSegment()],t||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=Zi(t)}setAll(e){let t=he.emptyPath(),n={},i=[];e.forEach((o,c)=>{if(!t.isImmediateParentOf(c)){const u=this.getFieldsMap(t);this.applyChanges(u,n,i),n={},i=[],t=c.popLast()}o?n[c.lastSegment()]=Zi(o):i.push(c.lastSegment())});const s=this.getFieldsMap(t);this.applyChanges(s,n,i)}delete(e){const t=this.field(e.popLast());vo(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return Tt(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let n=0;n<e.length;++n){let i=t.mapValue.fields[e.get(n)];vo(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(n)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,n){Tn(t,(i,s)=>e[i]=s);for(const i of n)delete e[i]}clone(){return new Me(Zi(this.value))}}function nm(r){const e=[];return Tn(r.fields,(t,n)=>{const i=new he([t]);if(vo(n)){const s=nm(n.mapValue).fields;if(s.length===0)e.push(i);else for(const o of s)e.push(i.child(o))}else e.push(i)}),new He(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class le{constructor(e,t,n,i,s,o,c){this.key=e,this.documentType=t,this.version=n,this.readTime=i,this.createTime=s,this.data=o,this.documentState=c}static newInvalidDocument(e){return new le(e,0,j.min(),j.min(),j.min(),Me.empty(),0)}static newFoundDocument(e,t,n,i){return new le(e,1,t,j.min(),n,i,0)}static newNoDocument(e,t){return new le(e,2,t,j.min(),j.min(),Me.empty(),0)}static newUnknownDocument(e,t){return new le(e,3,t,j.min(),j.min(),Me.empty(),2)}convertToFoundDocument(e,t){return!this.createTime.isEqual(j.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=Me.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=Me.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=j.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof le&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new le(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mn{constructor(e,t){this.position=e,this.inclusive=t}}function wd(r,e,t){let n=0;for(let i=0;i<r.position.length;i++){const s=e[i],o=r.position[i];if(s.field.isKeyField()?n=x.comparator(x.fromName(o.referenceValue),t.key):n=pn(o,t.data.field(s.field)),s.dir==="desc"&&(n*=-1),n!==0)break}return n}function vd(r,e){if(r===null)return e===null;if(e===null||r.inclusive!==e.inclusive||r.position.length!==e.position.length)return!1;for(let t=0;t<r.position.length;t++)if(!Tt(r.position[t],e.position[t]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ys{constructor(e,t="asc"){this.field=e,this.dir=t}}function NT(r,e){return r.dir===e.dir&&r.field.isEqual(e.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rm{}class Y extends rm{constructor(e,t,n){super(),this.field=e,this.op=t,this.value=n}static create(e,t,n){return e.isKeyField()?t==="in"||t==="not-in"?this.createKeyFieldInFilter(e,t,n):new OT(e,t,n):t==="array-contains"?new LT(e,n):t==="in"?new um(e,n):t==="not-in"?new FT(e,n):t==="array-contains-any"?new UT(e,n):new Y(e,t,n)}static createKeyFieldInFilter(e,t,n){return t==="in"?new xT(e,n):new MT(e,n)}matches(e){const t=e.data.field(this.field);return this.op==="!="?t!==null&&t.nullValue===void 0&&this.matchesComparison(pn(t,this.value)):t!==null&&fn(this.value)===fn(t)&&this.matchesComparison(pn(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return F(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class re extends rm{constructor(e,t){super(),this.filters=e,this.op=t,this.Pe=null}static create(e,t){return new re(e,t)}matches(e){return jr(this)?this.filters.find(t=>!t.matches(e))===void 0:this.filters.find(t=>t.matches(e))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function jr(r){return r.op==="and"}function $c(r){return r.op==="or"}function ku(r){return im(r)&&jr(r)}function im(r){for(const e of r.filters)if(e instanceof re)return!1;return!0}function Kc(r){if(r instanceof Y)return r.field.canonicalString()+r.op.toString()+zr(r.value);if(ku(r))return r.filters.map(e=>Kc(e)).join(",");{const e=r.filters.map(t=>Kc(t)).join(",");return`${r.op}(${e})`}}function sm(r,e){return r instanceof Y?function(n,i){return i instanceof Y&&n.op===i.op&&n.field.isEqual(i.field)&&Tt(n.value,i.value)}(r,e):r instanceof re?function(n,i){return i instanceof re&&n.op===i.op&&n.filters.length===i.filters.length?n.filters.reduce((s,o,c)=>s&&sm(o,i.filters[c]),!0):!1}(r,e):void F(19439)}function om(r,e){const t=r.filters.concat(e);return re.create(t,r.op)}function am(r){return r instanceof Y?function(t){return`${t.field.canonicalString()} ${t.op} ${zr(t.value)}`}(r):r instanceof re?function(t){return t.op.toString()+" {"+t.getFilters().map(am).join(" ,")+"}"}(r):"Filter"}class OT extends Y{constructor(e,t,n){super(e,t,n),this.key=x.fromName(n.referenceValue)}matches(e){const t=x.comparator(e.key,this.key);return this.matchesComparison(t)}}class xT extends Y{constructor(e,t){super(e,"in",t),this.keys=cm("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class MT extends Y{constructor(e,t){super(e,"not-in",t),this.keys=cm("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function cm(r,e){return(e.arrayValue?.values||[]).map(t=>x.fromName(t.referenceValue))}class LT extends Y{constructor(e,t){super(e,"array-contains",t)}matches(e){const t=e.data.field(this.field);return _s(t)&&gs(t.arrayValue,this.value)}}class um extends Y{constructor(e,t){super(e,"in",t)}matches(e){const t=e.data.field(this.field);return t!==null&&gs(this.value.arrayValue,t)}}class FT extends Y{constructor(e,t){super(e,"not-in",t)}matches(e){if(gs(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const t=e.data.field(this.field);return t!==null&&t.nullValue===void 0&&!gs(this.value.arrayValue,t)}}class UT extends Y{constructor(e,t){super(e,"array-contains-any",t)}matches(e){const t=e.data.field(this.field);return!(!_s(t)||!t.arrayValue.values)&&t.arrayValue.values.some(n=>gs(this.value.arrayValue,n))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class BT{constructor(e,t=null,n=[],i=[],s=null,o=null,c=null){this.path=e,this.collectionGroup=t,this.orderBy=n,this.filters=i,this.limit=s,this.startAt=o,this.endAt=c,this.Te=null}}function Wc(r,e=null,t=[],n=[],i=null,s=null,o=null){return new BT(r,e,t,n,i,s,o)}function Yn(r){const e=M(r);if(e.Te===null){let t=e.path.canonicalString();e.collectionGroup!==null&&(t+="|cg:"+e.collectionGroup),t+="|f:",t+=e.filters.map(n=>Kc(n)).join(","),t+="|ob:",t+=e.orderBy.map(n=>function(s){return s.field.canonicalString()+s.dir}(n)).join(","),Ps(e.limit)||(t+="|l:",t+=e.limit),e.startAt&&(t+="|lb:",t+=e.startAt.inclusive?"b:":"a:",t+=e.startAt.position.map(n=>zr(n)).join(",")),e.endAt&&(t+="|ub:",t+=e.endAt.inclusive?"a:":"b:",t+=e.endAt.position.map(n=>zr(n)).join(",")),e.Te=t}return e.Te}function Ds(r,e){if(r.limit!==e.limit||r.orderBy.length!==e.orderBy.length)return!1;for(let t=0;t<r.orderBy.length;t++)if(!NT(r.orderBy[t],e.orderBy[t]))return!1;if(r.filters.length!==e.filters.length)return!1;for(let t=0;t<r.filters.length;t++)if(!sm(r.filters[t],e.filters[t]))return!1;return r.collectionGroup===e.collectionGroup&&!!r.path.isEqual(e.path)&&!!vd(r.startAt,e.startAt)&&vd(r.endAt,e.endAt)}function Lo(r){return x.isDocumentKey(r.path)&&r.collectionGroup===null&&r.filters.length===0}function Fo(r,e){return r.filters.filter(t=>t instanceof Y&&t.field.isEqual(e))}function Ad(r,e,t){let n=To,i=!0;for(const s of Fo(r,e)){let o=To,c=!0;switch(s.op){case"<":case"<=":o=kT(s.value);break;case"==":case"in":case">=":o=s.value;break;case">":o=s.value,c=!1;break;case"!=":case"not-in":o=To}Ed({value:n,inclusive:i},{value:o,inclusive:c})<0&&(n=o,i=c)}if(t!==null){for(let s=0;s<r.orderBy.length;++s)if(r.orderBy[s].field.isEqual(e)){const o=t.position[s];Ed({value:n,inclusive:i},{value:o,inclusive:t.inclusive})<0&&(n=o,i=t.inclusive);break}}return{value:n,inclusive:i}}function Rd(r,e,t){let n=nn,i=!0;for(const s of Fo(r,e)){let o=nn,c=!0;switch(s.op){case">=":case">":o=VT(s.value),c=!1;break;case"==":case"in":case"<=":o=s.value;break;case"<":o=s.value,c=!1;break;case"!=":case"not-in":o=nn}Td({value:n,inclusive:i},{value:o,inclusive:c})>0&&(n=o,i=c)}if(t!==null){for(let s=0;s<r.orderBy.length;++s)if(r.orderBy[s].field.isEqual(e)){const o=t.position[s];Td({value:n,inclusive:i},{value:o,inclusive:t.inclusive})>0&&(n=o,i=t.inclusive);break}}return{value:n,inclusive:i}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ft{constructor(e,t=null,n=[],i=[],s=null,o="F",c=null,u=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=n,this.filters=i,this.limit=s,this.limitType=o,this.startAt=c,this.endAt=u,this.Ie=null,this.Ee=null,this.de=null,this.startAt,this.endAt}}function lm(r,e,t,n,i,s,o,c){return new Ft(r,e,t,n,i,s,o,c)}function ii(r){return new Ft(r)}function Sd(r){return r.filters.length===0&&r.limit===null&&r.startAt==null&&r.endAt==null&&(r.explicitOrderBy.length===0||r.explicitOrderBy.length===1&&r.explicitOrderBy[0].field.isKeyField())}function Vu(r){return r.collectionGroup!==null}function Sr(r){const e=M(r);if(e.Ie===null){e.Ie=[];const t=new Set;for(const s of e.explicitOrderBy)e.Ie.push(s),t.add(s.field.canonicalString());const n=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let c=new se(he.comparator);return o.filters.forEach(u=>{u.getFlattenedFilters().forEach(l=>{l.isInequality()&&(c=c.add(l.field))})}),c})(e).forEach(s=>{t.has(s.canonicalString())||s.isKeyField()||e.Ie.push(new ys(s,n))}),t.has(he.keyField().canonicalString())||e.Ie.push(new ys(he.keyField(),n))}return e.Ie}function qe(r){const e=M(r);return e.Ee||(e.Ee=dm(e,Sr(r))),e.Ee}function hm(r){const e=M(r);return e.de||(e.de=dm(e,r.explicitOrderBy)),e.de}function dm(r,e){if(r.limitType==="F")return Wc(r.path,r.collectionGroup,e,r.filters,r.limit,r.startAt,r.endAt);{e=e.map(i=>{const s=i.dir==="desc"?"asc":"desc";return new ys(i.field,s)});const t=r.endAt?new mn(r.endAt.position,r.endAt.inclusive):null,n=r.startAt?new mn(r.startAt.position,r.startAt.inclusive):null;return Wc(r.path,r.collectionGroup,e,r.filters,r.limit,t,n)}}function Hc(r,e){const t=r.filters.concat([e]);return new Ft(r.path,r.collectionGroup,r.explicitOrderBy.slice(),t,r.limit,r.limitType,r.startAt,r.endAt)}function Uo(r,e,t){return new Ft(r.path,r.collectionGroup,r.explicitOrderBy.slice(),r.filters.slice(),e,t,r.startAt,r.endAt)}function ks(r,e){return Ds(qe(r),qe(e))&&r.limitType===e.limitType}function fm(r){return`${Yn(qe(r))}|lt:${r.limitType}`}function vr(r){return`Query(target=${function(t){let n=t.path.canonicalString();return t.collectionGroup!==null&&(n+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(n+=`, filters: [${t.filters.map(i=>am(i)).join(", ")}]`),Ps(t.limit)||(n+=", limit: "+t.limit),t.orderBy.length>0&&(n+=`, orderBy: [${t.orderBy.map(i=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(i)).join(", ")}]`),t.startAt&&(n+=", startAt: ",n+=t.startAt.inclusive?"b:":"a:",n+=t.startAt.position.map(i=>zr(i)).join(",")),t.endAt&&(n+=", endAt: ",n+=t.endAt.inclusive?"a:":"b:",n+=t.endAt.position.map(i=>zr(i)).join(",")),`Target(${n})`}(qe(r))}; limitType=${r.limitType})`}function Vs(r,e){return e.isFoundDocument()&&function(n,i){const s=i.key.path;return n.collectionGroup!==null?i.key.hasCollectionId(n.collectionGroup)&&n.path.isPrefixOf(s):x.isDocumentKey(n.path)?n.path.isEqual(s):n.path.isImmediateParentOf(s)}(r,e)&&function(n,i){for(const s of Sr(n))if(!s.field.isKeyField()&&i.data.field(s.field)===null)return!1;return!0}(r,e)&&function(n,i){for(const s of n.filters)if(!s.matches(i))return!1;return!0}(r,e)&&function(n,i){return!(n.startAt&&!function(o,c,u){const l=wd(o,c,u);return o.inclusive?l<=0:l<0}(n.startAt,Sr(n),i)||n.endAt&&!function(o,c,u){const l=wd(o,c,u);return o.inclusive?l>=0:l>0}(n.endAt,Sr(n),i))}(r,e)}function pm(r){return r.collectionGroup||(r.path.length%2==1?r.path.lastSegment():r.path.get(r.path.length-2))}function mm(r){return(e,t)=>{let n=!1;for(const i of Sr(r)){const s=qT(i,e,t);if(s!==0)return s;n=n||i.field.isKeyField()}return 0}}function qT(r,e,t){const n=r.field.isKeyField()?x.comparator(e.key,t.key):function(s,o,c){const u=o.data.field(s),l=c.data.field(s);return u!==null&&l!==null?pn(u,l):F(42886)}(r.field,e,t);switch(r.dir){case"asc":return n;case"desc":return-1*n;default:return F(19790,{direction:r.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ut{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n!==void 0){for(const[i,s]of n)if(this.equalsFn(i,e))return s}}has(e){return this.get(e)!==void 0}set(e,t){const n=this.mapKeyFn(e),i=this.inner[n];if(i===void 0)return this.inner[n]=[[e,t]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,t]);i.push([e,t]),this.innerSize++}delete(e){const t=this.mapKeyFn(e),n=this.inner[t];if(n===void 0)return!1;for(let i=0;i<n.length;i++)if(this.equalsFn(n[i][0],e))return n.length===1?delete this.inner[t]:n.splice(i,1),this.innerSize--,!0;return!1}forEach(e){Tn(this.inner,(t,n)=>{for(const[i,s]of n)e(i,s)})}isEmpty(){return Wp(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zT=new ce(x.comparator);function Qe(){return zT}const gm=new ce(x.comparator);function Gi(...r){let e=gm;for(const t of r)e=e.insert(t.key,t);return e}function _m(r){let e=gm;return r.forEach((t,n)=>e=e.insert(t,n.overlayedDocument)),e}function gt(){return es()}function ym(){return es()}function es(){return new Ut(r=>r.toString(),(r,e)=>r.isEqual(e))}const jT=new ce(x.comparator),GT=new se(x.comparator);function K(...r){let e=GT;for(const t of r)e=e.add(t);return e}const $T=new se($);function Nu(){return $T}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ou(r,e){if(r.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:ls(e)?"-0":e}}function Im(r){return{integerValue:""+r}}function Em(r,e){return xp(e)?Im(e):Ou(r,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ha{constructor(){this._=void 0}}function KT(r,e,t){return r instanceof Gr?function(i,s){const o={fields:{[Jp]:{stringValue:Qp},[Xp]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return s&&ca(s)&&(s=ua(s)),s&&(o.fields[Yp]=s),{mapValue:o}}(t,e):r instanceof Xn?wm(r,e):r instanceof Zn?vm(r,e):function(i,s){const o=Tm(i,s),c=bd(o)+bd(i.Ae);return Gc(o)&&Gc(i.Ae)?Im(c):Ou(i.serializer,c)}(r,e)}function WT(r,e,t){return r instanceof Xn?wm(r,e):r instanceof Zn?vm(r,e):t}function Tm(r,e){return r instanceof $r?function(n){return Gc(n)||function(s){return!!s&&"doubleValue"in s}(n)}(e)?e:{integerValue:0}:null}class Gr extends ha{}class Xn extends ha{constructor(e){super(),this.elements=e}}function wm(r,e){const t=Am(e);for(const n of r.elements)t.some(i=>Tt(i,n))||t.push(n);return{arrayValue:{values:t}}}class Zn extends ha{constructor(e){super(),this.elements=e}}function vm(r,e){let t=Am(e);for(const n of r.elements)t=t.filter(i=>!Tt(i,n));return{arrayValue:{values:t}}}class $r extends ha{constructor(e,t){super(),this.serializer=e,this.Ae=t}}function bd(r){return pe(r.integerValue||r.doubleValue)}function Am(r){return _s(r)&&r.arrayValue.values?r.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ns{constructor(e,t){this.field=e,this.transform=t}}function HT(r,e){return r.field.isEqual(e.field)&&function(n,i){return n instanceof Xn&&i instanceof Xn||n instanceof Zn&&i instanceof Zn?Nr(n.elements,i.elements,Tt):n instanceof $r&&i instanceof $r?Tt(n.Ae,i.Ae):n instanceof Gr&&i instanceof Gr}(r.transform,e.transform)}class QT{constructor(e,t){this.version=e,this.transformResults=t}}class ge{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new ge}static exists(e){return new ge(void 0,e)}static updateTime(e){return new ge(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Ao(r,e){return r.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(r.updateTime):r.exists===void 0||r.exists===e.isFoundDocument()}class da{}function Rm(r,e){if(!r.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return r.isNoDocument()?new oi(r.key,ge.none()):new si(r.key,r.data,ge.none());{const t=r.data,n=Me.empty();let i=new se(he.comparator);for(let s of e.fields)if(!i.has(s)){let o=t.field(s);o===null&&s.length>1&&(s=s.popLast(),o=t.field(s)),o===null?n.delete(s):n.set(s,o),i=i.add(s)}return new Bt(r.key,n,new He(i.toArray()),ge.none())}}function JT(r,e,t){r instanceof si?function(i,s,o){const c=i.value.clone(),u=Cd(i.fieldTransforms,s,o.transformResults);c.setAll(u),s.convertToFoundDocument(o.version,c).setHasCommittedMutations()}(r,e,t):r instanceof Bt?function(i,s,o){if(!Ao(i.precondition,s))return void s.convertToUnknownDocument(o.version);const c=Cd(i.fieldTransforms,s,o.transformResults),u=s.data;u.setAll(Sm(i)),u.setAll(c),s.convertToFoundDocument(o.version,u).setHasCommittedMutations()}(r,e,t):function(i,s,o){s.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,t)}function ts(r,e,t,n){return r instanceof si?function(s,o,c,u){if(!Ao(s.precondition,o))return c;const l=s.value.clone(),f=Dd(s.fieldTransforms,u,o);return l.setAll(f),o.convertToFoundDocument(o.version,l).setHasLocalMutations(),null}(r,e,t,n):r instanceof Bt?function(s,o,c,u){if(!Ao(s.precondition,o))return c;const l=Dd(s.fieldTransforms,u,o),f=o.data;return f.setAll(Sm(s)),f.setAll(l),o.convertToFoundDocument(o.version,f).setHasLocalMutations(),c===null?null:c.unionWith(s.fieldMask.fields).unionWith(s.fieldTransforms.map(p=>p.field))}(r,e,t,n):function(s,o,c){return Ao(s.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):c}(r,e,t)}function YT(r,e){let t=null;for(const n of r.fieldTransforms){const i=e.data.field(n.field),s=Tm(n.transform,i||null);s!=null&&(t===null&&(t=Me.empty()),t.set(n.field,s))}return t||null}function Pd(r,e){return r.type===e.type&&!!r.key.isEqual(e.key)&&!!r.precondition.isEqual(e.precondition)&&!!function(n,i){return n===void 0&&i===void 0||!(!n||!i)&&Nr(n,i,(s,o)=>HT(s,o))}(r.fieldTransforms,e.fieldTransforms)&&(r.type===0?r.value.isEqual(e.value):r.type!==1||r.data.isEqual(e.data)&&r.fieldMask.isEqual(e.fieldMask))}class si extends da{constructor(e,t,n,i=[]){super(),this.key=e,this.value=t,this.precondition=n,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class Bt extends da{constructor(e,t,n,i,s=[]){super(),this.key=e,this.data=t,this.fieldMask=n,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function Sm(r){const e=new Map;return r.fieldMask.fields.forEach(t=>{if(!t.isEmpty()){const n=r.data.field(t);e.set(t,n)}}),e}function Cd(r,e,t){const n=new Map;B(r.length===t.length,32656,{Re:t.length,Ve:r.length});for(let i=0;i<t.length;i++){const s=r[i],o=s.transform,c=e.data.field(s.field);n.set(s.field,WT(o,c,t[i]))}return n}function Dd(r,e,t){const n=new Map;for(const i of r){const s=i.transform,o=t.data.field(i.field);n.set(i.field,KT(s,o,e))}return n}class oi extends da{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class xu extends da{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mu{constructor(e,t,n,i){this.batchId=e,this.localWriteTime=t,this.baseMutations=n,this.mutations=i}applyToRemoteDocument(e,t){const n=t.mutationResults;for(let i=0;i<this.mutations.length;i++){const s=this.mutations[i];s.key.isEqual(e.key)&&JT(s,e,n[i])}}applyToLocalView(e,t){for(const n of this.baseMutations)n.key.isEqual(e.key)&&(t=ts(n,e,t,this.localWriteTime));for(const n of this.mutations)n.key.isEqual(e.key)&&(t=ts(n,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){const n=ym();return this.mutations.forEach(i=>{const s=e.get(i.key),o=s.overlayedDocument;let c=this.applyToLocalView(o,s.mutatedFields);c=t.has(i.key)?null:c;const u=Rm(o,c);u!==null&&n.set(i.key,u),o.isValidDocument()||o.convertToNoDocument(j.min())}),n}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),K())}isEqual(e){return this.batchId===e.batchId&&Nr(this.mutations,e.mutations,(t,n)=>Pd(t,n))&&Nr(this.baseMutations,e.baseMutations,(t,n)=>Pd(t,n))}}class Lu{constructor(e,t,n,i){this.batch=e,this.commitVersion=t,this.mutationResults=n,this.docVersions=i}static from(e,t,n){B(e.mutations.length===n.length,58842,{me:e.mutations.length,fe:n.length});let i=function(){return jT}();const s=e.mutations;for(let o=0;o<s.length;o++)i=i.insert(s[o].key,n[o].version);return new Lu(e,t,n,i)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fu{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bm{constructor(e,t,n){this.alias=e,this.aggregateType=t,this.fieldPath=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class XT{constructor(e,t){this.count=e,this.unchangedNames=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var ve,Z;function Pm(r){switch(r){case S.OK:return F(64938);case S.CANCELLED:case S.UNKNOWN:case S.DEADLINE_EXCEEDED:case S.RESOURCE_EXHAUSTED:case S.INTERNAL:case S.UNAVAILABLE:case S.UNAUTHENTICATED:return!1;case S.INVALID_ARGUMENT:case S.NOT_FOUND:case S.ALREADY_EXISTS:case S.PERMISSION_DENIED:case S.FAILED_PRECONDITION:case S.ABORTED:case S.OUT_OF_RANGE:case S.UNIMPLEMENTED:case S.DATA_LOSS:return!0;default:return F(15467,{code:r})}}function Cm(r){if(r===void 0)return Te("GRPC error has no .code"),S.UNKNOWN;switch(r){case ve.OK:return S.OK;case ve.CANCELLED:return S.CANCELLED;case ve.UNKNOWN:return S.UNKNOWN;case ve.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case ve.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case ve.INTERNAL:return S.INTERNAL;case ve.UNAVAILABLE:return S.UNAVAILABLE;case ve.UNAUTHENTICATED:return S.UNAUTHENTICATED;case ve.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case ve.NOT_FOUND:return S.NOT_FOUND;case ve.ALREADY_EXISTS:return S.ALREADY_EXISTS;case ve.PERMISSION_DENIED:return S.PERMISSION_DENIED;case ve.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case ve.ABORTED:return S.ABORTED;case ve.OUT_OF_RANGE:return S.OUT_OF_RANGE;case ve.UNIMPLEMENTED:return S.UNIMPLEMENTED;case ve.DATA_LOSS:return S.DATA_LOSS;default:return F(39323,{code:r})}}(Z=ve||(ve={}))[Z.OK=0]="OK",Z[Z.CANCELLED=1]="CANCELLED",Z[Z.UNKNOWN=2]="UNKNOWN",Z[Z.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",Z[Z.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",Z[Z.NOT_FOUND=5]="NOT_FOUND",Z[Z.ALREADY_EXISTS=6]="ALREADY_EXISTS",Z[Z.PERMISSION_DENIED=7]="PERMISSION_DENIED",Z[Z.UNAUTHENTICATED=16]="UNAUTHENTICATED",Z[Z.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",Z[Z.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",Z[Z.ABORTED=10]="ABORTED",Z[Z.OUT_OF_RANGE=11]="OUT_OF_RANGE",Z[Z.UNIMPLEMENTED=12]="UNIMPLEMENTED",Z[Z.INTERNAL=13]="INTERNAL",Z[Z.UNAVAILABLE=14]="UNAVAILABLE",Z[Z.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Qc=null;/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Dm(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ZT=new on([4294967295,4294967295],0);function kd(r){const e=Dm().encode(r),t=new _p;return t.update(e),new Uint8Array(t.digest())}function Vd(r){const e=new DataView(r.buffer),t=e.getUint32(0,!0),n=e.getUint32(4,!0),i=e.getUint32(8,!0),s=e.getUint32(12,!0);return[new on([t,n],0),new on([i,s],0)]}class Uu{constructor(e,t,n){if(this.bitmap=e,this.padding=t,this.hashCount=n,t<0||t>=8)throw new $i(`Invalid padding: ${t}`);if(n<0)throw new $i(`Invalid hash count: ${n}`);if(e.length>0&&this.hashCount===0)throw new $i(`Invalid hash count: ${n}`);if(e.length===0&&t!==0)throw new $i(`Invalid padding when bitmap length is 0: ${t}`);this.ge=8*e.length-t,this.pe=on.fromNumber(this.ge)}ye(e,t,n){let i=e.add(t.multiply(on.fromNumber(n)));return i.compare(ZT)===1&&(i=new on([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const t=kd(e),[n,i]=Vd(t);for(let s=0;s<this.hashCount;s++){const o=this.ye(n,i,s);if(!this.we(o))return!1}return!0}static create(e,t,n){const i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),o=new Uu(s,i,t);return n.forEach(c=>o.insert(c)),o}insert(e){if(this.ge===0)return;const t=kd(e),[n,i]=Vd(t);for(let s=0;s<this.hashCount;s++){const o=this.ye(n,i,s);this.Se(o)}}Se(e){const t=Math.floor(e/8),n=e%8;this.bitmap[t]|=1<<n}}class $i extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Os{constructor(e,t,n,i,s){this.snapshotVersion=e,this.targetChanges=t,this.targetMismatches=n,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,t,n){const i=new Map;return i.set(e,xs.createSynthesizedTargetChangeForCurrentChange(e,t,n)),new Os(j.min(),i,new ce($),Qe(),K())}}class xs{constructor(e,t,n,i,s){this.resumeToken=e,this.current=t,this.addedDocuments=n,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,t,n){return new xs(n,t,K(),K(),K())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ro{constructor(e,t,n,i){this.be=e,this.removedTargetIds=t,this.key=n,this.De=i}}class km{constructor(e,t){this.targetId=e,this.Ce=t}}class Vm{constructor(e,t,n=ye.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=t,this.resumeToken=n,this.cause=i}}class Nd{constructor(){this.ve=0,this.Fe=Od(),this.Me=ye.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=K(),t=K(),n=K();return this.Fe.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:t=t.add(i);break;case 1:n=n.add(i);break;default:F(38017,{changeType:s})}}),new xs(this.Me,this.xe,e,t,n)}qe(){this.Oe=!1,this.Fe=Od()}Qe(e,t){this.Oe=!0,this.Fe=this.Fe.insert(e,t)}$e(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}Ue(){this.ve+=1}Ke(){this.ve-=1,B(this.ve>=0,3241,{ve:this.ve})}We(){this.Oe=!0,this.xe=!0}}class ew{constructor(e){this.Ge=e,this.ze=new Map,this.je=Qe(),this.Je=uo(),this.He=uo(),this.Ye=new ce($)}Ze(e){for(const t of e.be)e.De&&e.De.isFoundDocument()?this.Xe(t,e.De):this.et(t,e.key,e.De);for(const t of e.removedTargetIds)this.et(t,e.key,e.De)}tt(e){this.forEachTarget(e,t=>{const n=this.nt(t);switch(e.state){case 0:this.rt(t)&&n.Le(e.resumeToken);break;case 1:n.Ke(),n.Ne||n.qe(),n.Le(e.resumeToken);break;case 2:n.Ke(),n.Ne||this.removeTarget(t);break;case 3:this.rt(t)&&(n.We(),n.Le(e.resumeToken));break;case 4:this.rt(t)&&(this.it(t),n.Le(e.resumeToken));break;default:F(56790,{state:e.state})}})}forEachTarget(e,t){e.targetIds.length>0?e.targetIds.forEach(t):this.ze.forEach((n,i)=>{this.rt(i)&&t(i)})}st(e){const t=e.targetId,n=e.Ce.count,i=this.ot(t);if(i){const s=i.target;if(Lo(s))if(n===0){const o=new x(s.path);this.et(t,o,le.newNoDocument(o,j.min()))}else B(n===1,20013,{expectedCount:n});else{const o=this._t(t);if(o!==n){const c=this.ut(e),u=c?this.ct(c,e,o):1;if(u!==0){this.it(t);const l=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ye=this.Ye.insert(t,l)}Qc?.lt(function(f,p,g,v,D){const k={localCacheCount:f,existenceFilterCount:p.count,databaseId:g.database,projectId:g.projectId},V=p.unchangedNames;return V&&(k.bloomFilter={applied:D===0,hashCount:V?.hashCount??0,bitmapLength:V?.bits?.bitmap?.length??0,padding:V?.bits?.padding??0,mightContain:U=>v?.mightContain(U)??!1}),k}(o,e.Ce,this.Ge.ht(),c,u))}}}}ut(e){const t=e.Ce.unchangedNames;if(!t||!t.bits)return null;const{bits:{bitmap:n="",padding:i=0},hashCount:s=0}=t;let o,c;try{o=xt(n).toUint8Array()}catch(u){if(u instanceof Hp)return nt("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{c=new Uu(o,i,s)}catch(u){return nt(u instanceof $i?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return c.ge===0?null:c}ct(e,t,n){return t.Ce.count===n-this.Pt(e,t.targetId)?0:2}Pt(e,t){const n=this.Ge.getRemoteKeysForTarget(t);let i=0;return n.forEach(s=>{const o=this.Ge.ht(),c=`projects/${o.projectId}/databases/${o.database}/documents/${s.path.canonicalString()}`;e.mightContain(c)||(this.et(t,s,null),i++)}),i}Tt(e){const t=new Map;this.ze.forEach((s,o)=>{const c=this.ot(o);if(c){if(s.current&&Lo(c.target)){const u=new x(c.target.path);this.It(u).has(o)||this.Et(o,u)||this.et(o,u,le.newNoDocument(u,e))}s.Be&&(t.set(o,s.ke()),s.qe())}});let n=K();this.He.forEach((s,o)=>{let c=!0;o.forEachWhile(u=>{const l=this.ot(u);return!l||l.purpose==="TargetPurposeLimboResolution"||(c=!1,!1)}),c&&(n=n.add(s))}),this.je.forEach((s,o)=>o.setReadTime(e));const i=new Os(e,t,this.Ye,this.je,n);return this.je=Qe(),this.Je=uo(),this.He=uo(),this.Ye=new ce($),i}Xe(e,t){if(!this.rt(e))return;const n=this.Et(e,t.key)?2:0;this.nt(e).Qe(t.key,n),this.je=this.je.insert(t.key,t),this.Je=this.Je.insert(t.key,this.It(t.key).add(e)),this.He=this.He.insert(t.key,this.dt(t.key).add(e))}et(e,t,n){if(!this.rt(e))return;const i=this.nt(e);this.Et(e,t)?i.Qe(t,1):i.$e(t),this.He=this.He.insert(t,this.dt(t).delete(e)),this.He=this.He.insert(t,this.dt(t).add(e)),n&&(this.je=this.je.insert(t,n))}removeTarget(e){this.ze.delete(e)}_t(e){const t=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+t.addedDocuments.size-t.removedDocuments.size}Ue(e){this.nt(e).Ue()}nt(e){let t=this.ze.get(e);return t||(t=new Nd,this.ze.set(e,t)),t}dt(e){let t=this.He.get(e);return t||(t=new se($),this.He=this.He.insert(e,t)),t}It(e){let t=this.Je.get(e);return t||(t=new se($),this.Je=this.Je.insert(e,t)),t}rt(e){const t=this.ot(e)!==null;return t||N("WatchChangeAggregator","Detected inactive target",e),t}ot(e){const t=this.ze.get(e);return t&&t.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new Nd),this.Ge.getRemoteKeysForTarget(e).forEach(t=>{this.et(e,t,null)})}Et(e,t){return this.Ge.getRemoteKeysForTarget(e).has(t)}}function uo(){return new ce(x.comparator)}function Od(){return new ce(x.comparator)}const tw={asc:"ASCENDING",desc:"DESCENDING"},nw={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},rw={and:"AND",or:"OR"};class iw{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function Jc(r,e){return r.useProto3Json||Ps(e)?e:{value:e}}function Kr(r,e){return r.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function Nm(r,e){return r.useProto3Json?e.toBase64():e.toUint8Array()}function sw(r,e){return Kr(r,e.toTimestamp())}function we(r){return B(!!r,49232),j.fromTimestamp(function(t){const n=Ot(t);return new ne(n.seconds,n.nanos)}(r))}function Bu(r,e){return Yc(r,e).canonicalString()}function Yc(r,e){const t=function(i){return new H(["projects",i.projectId,"databases",i.database])}(r).child("documents");return e===void 0?t:t.child(e)}function Om(r){const e=H.fromString(r);return B(jm(e),10190,{key:e.toString()}),e}function Is(r,e){return Bu(r.databaseId,e.path)}function Et(r,e){const t=Om(e);if(t.get(1)!==r.databaseId.projectId)throw new C(S.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+t.get(1)+" vs "+r.databaseId.projectId);if(t.get(3)!==r.databaseId.database)throw new C(S.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+t.get(3)+" vs "+r.databaseId.database);return new x(Lm(t))}function xm(r,e){return Bu(r.databaseId,e)}function Mm(r){const e=Om(r);return e.length===4?H.emptyPath():Lm(e)}function Xc(r){return new H(["projects",r.databaseId.projectId,"databases",r.databaseId.database]).canonicalString()}function Lm(r){return B(r.length>4&&r.get(4)==="documents",29091,{key:r.toString()}),r.popFirst(5)}function xd(r,e,t){return{name:Is(r,e),fields:t.value.mapValue.fields}}function fa(r,e,t){const n=Et(r,e.name),i=we(e.updateTime),s=e.createTime?we(e.createTime):j.min(),o=new Me({mapValue:{fields:e.fields}}),c=le.newFoundDocument(n,i,s,o);return t&&c.setHasCommittedMutations(),t?c.setHasCommittedMutations():c}function ow(r,e){return"found"in e?function(n,i){B(!!i.found,43571),i.found.name,i.found.updateTime;const s=Et(n,i.found.name),o=we(i.found.updateTime),c=i.found.createTime?we(i.found.createTime):j.min(),u=new Me({mapValue:{fields:i.found.fields}});return le.newFoundDocument(s,o,c,u)}(r,e):"missing"in e?function(n,i){B(!!i.missing,3894),B(!!i.readTime,22933);const s=Et(n,i.missing),o=we(i.readTime);return le.newNoDocument(s,o)}(r,e):F(7234,{result:e})}function aw(r,e){let t;if("targetChange"in e){e.targetChange;const n=function(l){return l==="NO_CHANGE"?0:l==="ADD"?1:l==="REMOVE"?2:l==="CURRENT"?3:l==="RESET"?4:F(39313,{state:l})}(e.targetChange.targetChangeType||"NO_CHANGE"),i=e.targetChange.targetIds||[],s=function(l,f){return l.useProto3Json?(B(f===void 0||typeof f=="string",58123),ye.fromBase64String(f||"")):(B(f===void 0||f instanceof Buffer||f instanceof Uint8Array,16193),ye.fromUint8Array(f||new Uint8Array))}(r,e.targetChange.resumeToken),o=e.targetChange.cause,c=o&&function(l){const f=l.code===void 0?S.UNKNOWN:Cm(l.code);return new C(f,l.message||"")}(o);t=new Vm(n,i,s,c||null)}else if("documentChange"in e){e.documentChange;const n=e.documentChange;n.document,n.document.name,n.document.updateTime;const i=Et(r,n.document.name),s=we(n.document.updateTime),o=n.document.createTime?we(n.document.createTime):j.min(),c=new Me({mapValue:{fields:n.document.fields}}),u=le.newFoundDocument(i,s,o,c),l=n.targetIds||[],f=n.removedTargetIds||[];t=new Ro(l,f,u.key,u)}else if("documentDelete"in e){e.documentDelete;const n=e.documentDelete;n.document;const i=Et(r,n.document),s=n.readTime?we(n.readTime):j.min(),o=le.newNoDocument(i,s),c=n.removedTargetIds||[];t=new Ro([],c,o.key,o)}else if("documentRemove"in e){e.documentRemove;const n=e.documentRemove;n.document;const i=Et(r,n.document),s=n.removedTargetIds||[];t=new Ro([],s,i,null)}else{if(!("filter"in e))return F(11601,{Rt:e});{e.filter;const n=e.filter;n.targetId;const{count:i=0,unchangedNames:s}=n,o=new XT(i,s),c=n.targetId;t=new km(c,o)}}return t}function Es(r,e){let t;if(e instanceof si)t={update:xd(r,e.key,e.value)};else if(e instanceof oi)t={delete:Is(r,e.key)};else if(e instanceof Bt)t={update:xd(r,e.key,e.data),updateMask:fw(e.fieldMask)};else{if(!(e instanceof xu))return F(16599,{Vt:e.type});t={verify:Is(r,e.key)}}return e.fieldTransforms.length>0&&(t.updateTransforms=e.fieldTransforms.map(n=>function(s,o){const c=o.transform;if(c instanceof Gr)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(c instanceof Xn)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:c.elements}};if(c instanceof Zn)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:c.elements}};if(c instanceof $r)return{fieldPath:o.field.canonicalString(),increment:c.Ae};throw F(20930,{transform:o.transform})}(0,n))),e.precondition.isNone||(t.currentDocument=function(i,s){return s.updateTime!==void 0?{updateTime:sw(i,s.updateTime)}:s.exists!==void 0?{exists:s.exists}:F(27497)}(r,e.precondition)),t}function Zc(r,e){const t=e.currentDocument?function(s){return s.updateTime!==void 0?ge.updateTime(we(s.updateTime)):s.exists!==void 0?ge.exists(s.exists):ge.none()}(e.currentDocument):ge.none(),n=e.updateTransforms?e.updateTransforms.map(i=>function(o,c){let u=null;if("setToServerValue"in c)B(c.setToServerValue==="REQUEST_TIME",16630,{proto:c}),u=new Gr;else if("appendMissingElements"in c){const f=c.appendMissingElements.values||[];u=new Xn(f)}else if("removeAllFromArray"in c){const f=c.removeAllFromArray.values||[];u=new Zn(f)}else"increment"in c?u=new $r(o,c.increment):F(16584,{proto:c});const l=he.fromServerFormat(c.fieldPath);return new Ns(l,u)}(r,i)):[];if(e.update){e.update.name;const i=Et(r,e.update.name),s=new Me({mapValue:{fields:e.update.fields}});if(e.updateMask){const o=function(u){const l=u.fieldPaths||[];return new He(l.map(f=>he.fromServerFormat(f)))}(e.updateMask);return new Bt(i,s,o,t,n)}return new si(i,s,t,n)}if(e.delete){const i=Et(r,e.delete);return new oi(i,t)}if(e.verify){const i=Et(r,e.verify);return new xu(i,t)}return F(1463,{proto:e})}function cw(r,e){return r&&r.length>0?(B(e!==void 0,14353),r.map(t=>function(i,s){let o=i.updateTime?we(i.updateTime):we(s);return o.isEqual(j.min())&&(o=we(s)),new QT(o,i.transformResults||[])}(t,e))):[]}function Fm(r,e){return{documents:[xm(r,e.path)]}}function pa(r,e){const t={structuredQuery:{}},n=e.path;let i;e.collectionGroup!==null?(i=n,t.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(i=n.popLast(),t.structuredQuery.from=[{collectionId:n.lastSegment()}]),t.parent=xm(r,i);const s=function(l){if(l.length!==0)return zm(re.create(l,"and"))}(e.filters);s&&(t.structuredQuery.where=s);const o=function(l){if(l.length!==0)return l.map(f=>function(g){return{field:en(g.field),direction:lw(g.dir)}}(f))}(e.orderBy);o&&(t.structuredQuery.orderBy=o);const c=Jc(r,e.limit);return c!==null&&(t.structuredQuery.limit=c),e.startAt&&(t.structuredQuery.startAt=function(l){return{before:l.inclusive,values:l.position}}(e.startAt)),e.endAt&&(t.structuredQuery.endAt=function(l){return{before:!l.inclusive,values:l.position}}(e.endAt)),{ft:t,parent:i}}function Um(r,e,t,n){const{ft:i,parent:s}=pa(r,e),o={},c=[];let u=0;return t.forEach(l=>{const f=n?l.alias:"aggregate_"+u++;o[f]=l.alias,l.aggregateType==="count"?c.push({alias:f,count:{}}):l.aggregateType==="avg"?c.push({alias:f,avg:{field:en(l.fieldPath)}}):l.aggregateType==="sum"&&c.push({alias:f,sum:{field:en(l.fieldPath)}})}),{request:{structuredAggregationQuery:{aggregations:c,structuredQuery:i.structuredQuery},parent:i.parent},gt:o,parent:s}}function Bm(r){let e=Mm(r.parent);const t=r.structuredQuery,n=t.from?t.from.length:0;let i=null;if(n>0){B(n===1,65062);const f=t.from[0];f.allDescendants?i=f.collectionId:e=e.child(f.collectionId)}let s=[];t.where&&(s=function(p){const g=qm(p);return g instanceof re&&ku(g)?g.getFilters():[g]}(t.where));let o=[];t.orderBy&&(o=function(p){return p.map(g=>function(D){return new ys(Ar(D.field),function(V){switch(V){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(D.direction))}(g))}(t.orderBy));let c=null;t.limit&&(c=function(p){let g;return g=typeof p=="object"?p.value:p,Ps(g)?null:g}(t.limit));let u=null;t.startAt&&(u=function(p){const g=!!p.before,v=p.values||[];return new mn(v,g)}(t.startAt));let l=null;return t.endAt&&(l=function(p){const g=!p.before,v=p.values||[];return new mn(v,g)}(t.endAt)),lm(e,i,o,s,c,"F",u,l)}function uw(r,e){const t=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return F(28987,{purpose:i})}}(e.purpose);return t==null?null:{"goog-listen-tags":t}}function qm(r){return r.unaryFilter!==void 0?function(t){switch(t.unaryFilter.op){case"IS_NAN":const n=Ar(t.unaryFilter.field);return Y.create(n,"==",{doubleValue:NaN});case"IS_NULL":const i=Ar(t.unaryFilter.field);return Y.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const s=Ar(t.unaryFilter.field);return Y.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=Ar(t.unaryFilter.field);return Y.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return F(61313);default:return F(60726)}}(r):r.fieldFilter!==void 0?function(t){return Y.create(Ar(t.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return F(58110);default:return F(50506)}}(t.fieldFilter.op),t.fieldFilter.value)}(r):r.compositeFilter!==void 0?function(t){return re.create(t.compositeFilter.filters.map(n=>qm(n)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return F(1026)}}(t.compositeFilter.op))}(r):F(30097,{filter:r})}function lw(r){return tw[r]}function hw(r){return nw[r]}function dw(r){return rw[r]}function en(r){return{fieldPath:r.canonicalString()}}function Ar(r){return he.fromServerFormat(r.fieldPath)}function zm(r){return r instanceof Y?function(t){if(t.op==="=="){if(Id(t.value))return{unaryFilter:{field:en(t.field),op:"IS_NAN"}};if(yd(t.value))return{unaryFilter:{field:en(t.field),op:"IS_NULL"}}}else if(t.op==="!="){if(Id(t.value))return{unaryFilter:{field:en(t.field),op:"IS_NOT_NAN"}};if(yd(t.value))return{unaryFilter:{field:en(t.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:en(t.field),op:hw(t.op),value:t.value}}}(r):r instanceof re?function(t){const n=t.getFilters().map(i=>zm(i));return n.length===1?n[0]:{compositeFilter:{op:dw(t.op),filters:n}}}(r):F(54877,{filter:r})}function fw(r){const e=[];return r.fields.forEach(t=>e.push(t.canonicalString())),{fieldPaths:e}}function jm(r){return r.length>=4&&r.get(0)==="projects"&&r.get(2)==="databases"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pt{constructor(e,t,n,i,s=j.min(),o=j.min(),c=ye.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=t,this.purpose=n,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=c,this.expectedCount=u}withSequenceNumber(e){return new Pt(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,t){return new Pt(this.target,this.targetId,this.purpose,this.sequenceNumber,t,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Pt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Pt(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gm{constructor(e){this.yt=e}}function pw(r,e){let t;if(e.document)t=fa(r.yt,e.document,!!e.hasCommittedMutations);else if(e.noDocument){const n=x.fromSegments(e.noDocument.path),i=tr(e.noDocument.readTime);t=le.newNoDocument(n,i),e.hasCommittedMutations&&t.setHasCommittedMutations()}else{if(!e.unknownDocument)return F(56709);{const n=x.fromSegments(e.unknownDocument.path),i=tr(e.unknownDocument.version);t=le.newUnknownDocument(n,i)}}return e.readTime&&t.setReadTime(function(i){const s=new ne(i[0],i[1]);return j.fromTimestamp(s)}(e.readTime)),t}function Md(r,e){const t=e.key,n={prefixPath:t.getCollectionPath().popLast().toArray(),collectionGroup:t.collectionGroup,documentId:t.path.lastSegment(),readTime:Bo(e.readTime),hasCommittedMutations:e.hasCommittedMutations};if(e.isFoundDocument())n.document=function(s,o){return{name:Is(s,o.key),fields:o.data.value.mapValue.fields,updateTime:Kr(s,o.version.toTimestamp()),createTime:Kr(s,o.createTime.toTimestamp())}}(r.yt,e);else if(e.isNoDocument())n.noDocument={path:t.path.toArray(),readTime:er(e.version)};else{if(!e.isUnknownDocument())return F(57904,{document:e});n.unknownDocument={path:t.path.toArray(),version:er(e.version)}}return n}function Bo(r){const e=r.toTimestamp();return[e.seconds,e.nanoseconds]}function er(r){const e=r.toTimestamp();return{seconds:e.seconds,nanoseconds:e.nanoseconds}}function tr(r){const e=new ne(r.seconds,r.nanoseconds);return j.fromTimestamp(e)}function Un(r,e){const t=(e.baseMutations||[]).map(s=>Zc(r.yt,s));for(let s=0;s<e.mutations.length-1;++s){const o=e.mutations[s];if(s+1<e.mutations.length&&e.mutations[s+1].transform!==void 0){const c=e.mutations[s+1];o.updateTransforms=c.transform.fieldTransforms,e.mutations.splice(s+1,1),++s}}const n=e.mutations.map(s=>Zc(r.yt,s)),i=ne.fromMillis(e.localWriteTimeMs);return new Mu(e.batchId,i,t,n)}function Ki(r){const e=tr(r.readTime),t=r.lastLimboFreeSnapshotVersion!==void 0?tr(r.lastLimboFreeSnapshotVersion):j.min();let n;return n=function(s){return s.documents!==void 0}(r.query)?function(s){const o=s.documents.length;return B(o===1,1966,{count:o}),qe(ii(Mm(s.documents[0])))}(r.query):function(s){return qe(Bm(s))}(r.query),new Pt(n,r.targetId,"TargetPurposeListen",r.lastListenSequenceNumber,e,t,ye.fromBase64String(r.resumeToken))}function $m(r,e){const t=er(e.snapshotVersion),n=er(e.lastLimboFreeSnapshotVersion);let i;i=Lo(e.target)?Fm(r.yt,e.target):pa(r.yt,e.target).ft;const s=e.resumeToken.toBase64();return{targetId:e.targetId,canonicalId:Yn(e.target),readTime:t,resumeToken:s,lastListenSequenceNumber:e.sequenceNumber,lastLimboFreeSnapshotVersion:n,query:i}}function ma(r){const e=Bm({parent:r.parent,structuredQuery:r.structuredQuery});return r.limitType==="LAST"?Uo(e,e.limit,"L"):e}function mc(r,e){return new Fu(e.largestBatchId,Zc(r.yt,e.overlayMutation))}function Ld(r,e){const t=e.path.lastSegment();return[r,Be(e.path.popLast()),t]}function Fd(r,e,t,n){return{indexId:r,uid:e,sequenceNumber:t,readTime:er(n.readTime),documentKey:Be(n.documentKey.path),largestBatchId:n.largestBatchId}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mw{getBundleMetadata(e,t){return Ud(e).get(t).next(n=>{if(n)return function(s){return{id:s.bundleId,createTime:tr(s.createTime),version:s.version}}(n)})}saveBundleMetadata(e,t){return Ud(e).put(function(i){return{bundleId:i.id,createTime:er(we(i.createTime)),version:i.version}}(t))}getNamedQuery(e,t){return Bd(e).get(t).next(n=>{if(n)return function(s){return{name:s.name,query:ma(s.bundledQuery),readTime:tr(s.readTime)}}(n)})}saveNamedQuery(e,t){return Bd(e).put(function(i){return{name:i.name,readTime:er(we(i.readTime)),bundledQuery:i.bundledQuery}}(t))}}function Ud(r){return Ce(r,sa)}function Bd(r){return Ce(r,oa)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ga{constructor(e,t){this.serializer=e,this.userId=t}static wt(e,t){const n=t.uid||"";return new ga(e,n)}getOverlay(e,t){return xi(e).get(Ld(this.userId,t)).next(n=>n?mc(this.serializer,n):null)}getOverlays(e,t){const n=gt();return A.forEach(t,i=>this.getOverlay(e,i).next(s=>{s!==null&&n.set(i,s)})).next(()=>n)}saveOverlays(e,t,n){const i=[];return n.forEach((s,o)=>{const c=new Fu(t,o);i.push(this.St(e,c))}),A.waitFor(i)}removeOverlaysForBatchId(e,t,n){const i=new Set;t.forEach(o=>i.add(Be(o.getCollectionPath())));const s=[];return i.forEach(o=>{const c=IDBKeyRange.bound([this.userId,o,n],[this.userId,o,n+1],!1,!0);s.push(xi(e).Z(qc,c))}),A.waitFor(s)}getOverlaysForCollection(e,t,n){const i=gt(),s=Be(t),o=IDBKeyRange.bound([this.userId,s,n],[this.userId,s,Number.POSITIVE_INFINITY],!0);return xi(e).J(qc,o).next(c=>{for(const u of c){const l=mc(this.serializer,u);i.set(l.getKey(),l)}return i})}getOverlaysForCollectionGroup(e,t,n,i){const s=gt();let o;const c=IDBKeyRange.bound([this.userId,t,n],[this.userId,t,Number.POSITIVE_INFINITY],!0);return xi(e).ee({index:qp,range:c},(u,l,f)=>{const p=mc(this.serializer,l);s.size()<i||p.largestBatchId===o?(s.set(p.getKey(),p),o=p.largestBatchId):f.done()}).next(()=>s)}St(e,t){return xi(e).put(function(i,s,o){const[c,u,l]=Ld(s,o.mutation.key);return{userId:s,collectionPath:u,documentId:l,collectionGroup:o.mutation.key.getCollectionGroup(),largestBatchId:o.largestBatchId,overlayMutation:Es(i.yt,o.mutation)}}(this.serializer,this.userId,t))}}function xi(r){return Ce(r,aa)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gw{bt(e){return Ce(e,bu)}getSessionToken(e){return this.bt(e).get("sessionToken").next(t=>{const n=t?.value;return n?ye.fromUint8Array(n):ye.EMPTY_BYTE_STRING})}setSessionToken(e,t){return this.bt(e).put({name:"sessionToken",value:t.toUint8Array()})}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bn{constructor(){}Dt(e,t){this.Ct(e,t),t.vt()}Ct(e,t){if("nullValue"in e)this.Ft(t,5);else if("booleanValue"in e)this.Ft(t,10),t.Mt(e.booleanValue?1:0);else if("integerValue"in e)this.Ft(t,15),t.Mt(pe(e.integerValue));else if("doubleValue"in e){const n=pe(e.doubleValue);isNaN(n)?this.Ft(t,13):(this.Ft(t,15),ls(n)?t.Mt(0):t.Mt(n))}else if("timestampValue"in e){let n=e.timestampValue;this.Ft(t,20),typeof n=="string"&&(n=Ot(n)),t.xt(`${n.seconds||""}`),t.Mt(n.nanos||0)}else if("stringValue"in e)this.Ot(e.stringValue,t),this.Nt(t);else if("bytesValue"in e)this.Ft(t,30),t.Bt(xt(e.bytesValue)),this.Nt(t);else if("referenceValue"in e)this.Lt(e.referenceValue,t);else if("geoPointValue"in e){const n=e.geoPointValue;this.Ft(t,45),t.Mt(n.latitude||0),t.Mt(n.longitude||0)}else"mapValue"in e?em(e)?this.Ft(t,Number.MAX_SAFE_INTEGER):la(e)?this.kt(e.mapValue,t):(this.qt(e.mapValue,t),this.Nt(t)):"arrayValue"in e?(this.Qt(e.arrayValue,t),this.Nt(t)):F(19022,{$t:e})}Ot(e,t){this.Ft(t,25),this.Ut(e,t)}Ut(e,t){t.xt(e)}qt(e,t){const n=e.fields||{};this.Ft(t,55);for(const i of Object.keys(n))this.Ot(i,t),this.Ct(n[i],t)}kt(e,t){const n=e.fields||{};this.Ft(t,53);const i=qr,s=n[i].arrayValue?.values?.length||0;this.Ft(t,15),t.Mt(pe(s)),this.Ot(i,t),this.Ct(n[i],t)}Qt(e,t){const n=e.values||[];this.Ft(t,50);for(const i of n)this.Ct(i,t)}Lt(e,t){this.Ft(t,37),x.fromName(e).path.forEach(n=>{this.Ft(t,60),this.Ut(n,t)})}Ft(e,t){e.Mt(t)}Nt(e){e.Mt(2)}}Bn.Kt=new Bn;/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law | agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES | CONDITIONS OF ANY KIND, either express | implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yr=255;function _w(r){if(r===0)return 8;let e=0;return r>>4||(e+=4,r<<=4),r>>6||(e+=2,r<<=2),r>>7||(e+=1),e}function qd(r){const e=64-function(n){let i=0;for(let s=0;s<8;++s){const o=_w(255&n[s]);if(i+=o,o!==8)break}return i}(r);return Math.ceil(e/8)}class yw{constructor(){this.buffer=new Uint8Array(1024),this.position=0}Wt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Gt(n.value),n=t.next();this.zt()}jt(e){const t=e[Symbol.iterator]();let n=t.next();for(;!n.done;)this.Jt(n.value),n=t.next();this.Ht()}Yt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Gt(n);else if(n<2048)this.Gt(960|n>>>6),this.Gt(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Gt(480|n>>>12),this.Gt(128|63&n>>>6),this.Gt(128|63&n);else{const i=t.codePointAt(0);this.Gt(240|i>>>18),this.Gt(128|63&i>>>12),this.Gt(128|63&i>>>6),this.Gt(128|63&i)}}this.zt()}Zt(e){for(const t of e){const n=t.charCodeAt(0);if(n<128)this.Jt(n);else if(n<2048)this.Jt(960|n>>>6),this.Jt(128|63&n);else if(t<"\uD800"||"\uDBFF"<t)this.Jt(480|n>>>12),this.Jt(128|63&n>>>6),this.Jt(128|63&n);else{const i=t.codePointAt(0);this.Jt(240|i>>>18),this.Jt(128|63&i>>>12),this.Jt(128|63&i>>>6),this.Jt(128|63&i)}}this.Ht()}Xt(e){const t=this.en(e),n=qd(t);this.tn(1+n),this.buffer[this.position++]=255&n;for(let i=t.length-n;i<t.length;++i)this.buffer[this.position++]=255&t[i]}nn(e){const t=this.en(e),n=qd(t);this.tn(1+n),this.buffer[this.position++]=~(255&n);for(let i=t.length-n;i<t.length;++i)this.buffer[this.position++]=~(255&t[i])}rn(){this.sn(yr),this.sn(255)}_n(){this.an(yr),this.an(255)}reset(){this.position=0}seed(e){this.tn(e.length),this.buffer.set(e,this.position),this.position+=e.length}un(){return this.buffer.slice(0,this.position)}en(e){const t=function(s){const o=new DataView(new ArrayBuffer(8));return o.setFloat64(0,s,!1),new Uint8Array(o.buffer)}(e),n=!!(128&t[0]);t[0]^=n?255:128;for(let i=1;i<t.length;++i)t[i]^=n?255:0;return t}Gt(e){const t=255&e;t===0?(this.sn(0),this.sn(255)):t===yr?(this.sn(yr),this.sn(0)):this.sn(t)}Jt(e){const t=255&e;t===0?(this.an(0),this.an(255)):t===yr?(this.an(yr),this.an(0)):this.an(e)}zt(){this.sn(0),this.sn(1)}Ht(){this.an(0),this.an(1)}sn(e){this.tn(1),this.buffer[this.position++]=e}an(e){this.tn(1),this.buffer[this.position++]=~e}tn(e){const t=e+this.position;if(t<=this.buffer.length)return;let n=2*this.buffer.length;n<t&&(n=t);const i=new Uint8Array(n);i.set(this.buffer),this.buffer=i}}class Iw{constructor(e){this.cn=e}Bt(e){this.cn.Wt(e)}xt(e){this.cn.Yt(e)}Mt(e){this.cn.Xt(e)}vt(){this.cn.rn()}}class Ew{constructor(e){this.cn=e}Bt(e){this.cn.jt(e)}xt(e){this.cn.Zt(e)}Mt(e){this.cn.nn(e)}vt(){this.cn._n()}}class Mi{constructor(){this.cn=new yw,this.ln=new Iw(this.cn),this.hn=new Ew(this.cn)}seed(e){this.cn.seed(e)}Pn(e){return e===0?this.ln:this.hn}un(){return this.cn.un()}reset(){this.cn.reset()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qn{constructor(e,t,n,i){this.Tn=e,this.In=t,this.En=n,this.dn=i}An(){const e=this.dn.length,t=e===0||this.dn[e-1]===255?e+1:e,n=new Uint8Array(t);return n.set(this.dn,0),t!==e?n.set([0],this.dn.length):++n[n.length-1],new qn(this.Tn,this.In,this.En,n)}Rn(e,t,n){return{indexId:this.Tn,uid:e,arrayValue:So(this.En),directionalValue:So(this.dn),orderedDocumentKey:So(t),documentKey:n.path.toArray()}}Vn(e,t,n){const i=this.Rn(e,t,n);return[i.indexId,i.uid,i.arrayValue,i.directionalValue,i.orderedDocumentKey,i.documentKey]}}function Jt(r,e){let t=r.Tn-e.Tn;return t!==0?t:(t=zd(r.En,e.En),t!==0?t:(t=zd(r.dn,e.dn),t!==0?t:x.comparator(r.In,e.In)))}function zd(r,e){for(let t=0;t<r.length&&t<e.length;++t){const n=r[t]-e[t];if(n!==0)return n}return r.length-e.length}function So(r){return ip()?function(t){let n="";for(let i=0;i<t.length;i++)n+=String.fromCharCode(t[i]);return n}(r):r}function jd(r){return typeof r!="string"?r:function(t){const n=new Uint8Array(t.length);for(let i=0;i<t.length;i++)n[i]=t.charCodeAt(i);return n}(r)}class Gd{constructor(e){this.mn=new se((t,n)=>he.comparator(t.field,n.field)),this.collectionId=e.collectionGroup!=null?e.collectionGroup:e.path.lastSegment(),this.fn=e.orderBy,this.gn=[];for(const t of e.filters){const n=t;n.isInequality()?this.mn=this.mn.add(n):this.gn.push(n)}}get pn(){return this.mn.size>1}yn(e){if(B(e.collectionGroup===this.collectionId,49279),this.pn)return!1;const t=Fc(e);if(t!==void 0&&!this.wn(t))return!1;const n=Mn(e);let i=new Set,s=0,o=0;for(;s<n.length&&this.wn(n[s]);++s)i=i.add(n[s].fieldPath.canonicalString());if(s===n.length)return!0;if(this.mn.size>0){const c=this.mn.getIterator().getNext();if(!i.has(c.field.canonicalString())){const u=n[s];if(!this.Sn(c,u)||!this.bn(this.fn[o++],u))return!1}++s}for(;s<n.length;++s){const c=n[s];if(o>=this.fn.length||!this.bn(this.fn[o++],c))return!1}return!0}Dn(){if(this.pn)return null;let e=new se(he.comparator);const t=[];for(const n of this.gn)if(!n.field.isKeyField())if(n.op==="array-contains"||n.op==="array-contains-any")t.push(new Gn(n.field,2));else{if(e.has(n.field))continue;e=e.add(n.field),t.push(new Gn(n.field,0))}for(const n of this.fn)n.field.isKeyField()||e.has(n.field)||(e=e.add(n.field),t.push(new Gn(n.field,n.dir==="asc"?0:1)));return new xr(xr.UNKNOWN_ID,this.collectionId,t,Mr.empty())}wn(e){for(const t of this.gn)if(this.Sn(t,e))return!0;return!1}Sn(e,t){if(e===void 0||!e.field.isEqual(t.fieldPath))return!1;const n=e.op==="array-contains"||e.op==="array-contains-any";return t.kind===2===n}bn(e,t){return!!e.field.isEqual(t.fieldPath)&&(t.kind===0&&e.dir==="asc"||t.kind===1&&e.dir==="desc")}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Km(r){if(B(r instanceof Y||r instanceof re,20012),r instanceof Y){if(r instanceof um){const t=r.value.arrayValue?.values?.map(n=>Y.create(r.field,"==",n))||[];return re.create(t,"or")}return r}const e=r.filters.map(t=>Km(t));return re.create(e,r.op)}function Tw(r){if(r.getFilters().length===0)return[];const e=nu(Km(r));return B(Wm(e),7391),eu(e)||tu(e)?[e]:e.getFilters()}function eu(r){return r instanceof Y}function tu(r){return r instanceof re&&ku(r)}function Wm(r){return eu(r)||tu(r)||function(t){if(t instanceof re&&$c(t)){for(const n of t.getFilters())if(!eu(n)&&!tu(n))return!1;return!0}return!1}(r)}function nu(r){if(B(r instanceof Y||r instanceof re,34018),r instanceof Y)return r;if(r.filters.length===1)return nu(r.filters[0]);const e=r.filters.map(n=>nu(n));let t=re.create(e,r.op);return t=qo(t),Wm(t)?t:(B(t instanceof re,64498),B(jr(t),40251),B(t.filters.length>1,57927),t.filters.reduce((n,i)=>qu(n,i)))}function qu(r,e){let t;return B(r instanceof Y||r instanceof re,38388),B(e instanceof Y||e instanceof re,25473),t=r instanceof Y?e instanceof Y?function(i,s){return re.create([i,s],"and")}(r,e):$d(r,e):e instanceof Y?$d(e,r):function(i,s){if(B(i.filters.length>0&&s.filters.length>0,48005),jr(i)&&jr(s))return om(i,s.getFilters());const o=$c(i)?i:s,c=$c(i)?s:i,u=o.filters.map(l=>qu(l,c));return re.create(u,"or")}(r,e),qo(t)}function $d(r,e){if(jr(e))return om(e,r.getFilters());{const t=e.filters.map(n=>qu(r,n));return re.create(t,"or")}}function qo(r){if(B(r instanceof Y||r instanceof re,11850),r instanceof Y)return r;const e=r.getFilters();if(e.length===1)return qo(e[0]);if(im(r))return r;const t=e.map(i=>qo(i)),n=[];return t.forEach(i=>{i instanceof Y?n.push(i):i instanceof re&&(i.op===r.op?n.push(...i.filters):n.push(i))}),n.length===1?n[0]:re.create(n,r.op)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ww{constructor(){this.Cn=new zu}addToCollectionParentIndex(e,t){return this.Cn.add(t),A.resolve()}getCollectionParents(e,t){return A.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return A.resolve()}deleteFieldIndex(e,t){return A.resolve()}deleteAllFieldIndexes(e){return A.resolve()}createTargetIndexes(e,t){return A.resolve()}getDocumentsMatchingTarget(e,t){return A.resolve(null)}getIndexType(e,t){return A.resolve(0)}getFieldIndexes(e,t){return A.resolve([])}getNextCollectionGroupToUpdate(e){return A.resolve(null)}getMinOffset(e,t){return A.resolve(rt.min())}getMinOffsetFromCollectionGroup(e,t){return A.resolve(rt.min())}updateCollectionGroup(e,t,n){return A.resolve()}updateIndexEntries(e,t){return A.resolve()}}class zu{constructor(){this.index={}}add(e){const t=e.lastSegment(),n=e.popLast(),i=this.index[t]||new se(H.comparator),s=!i.has(n);return this.index[t]=i.add(n),s}has(e){const t=e.lastSegment(),n=e.popLast(),i=this.index[t];return i&&i.has(n)}getEntries(e){return(this.index[e]||new se(H.comparator)).toArray()}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kd="IndexedDbIndexManager",lo=new Uint8Array(0);class vw{constructor(e,t){this.databaseId=t,this.vn=new zu,this.Fn=new Ut(n=>Yn(n),(n,i)=>Ds(n,i)),this.uid=e.uid||""}addToCollectionParentIndex(e,t){if(!this.vn.has(t)){const n=t.lastSegment(),i=t.popLast();e.addOnCommittedListener(()=>{this.vn.add(t)});const s={collectionId:n,parent:Be(i)};return Wd(e).put(s)}return A.resolve()}getCollectionParents(e,t){const n=[],i=IDBKeyRange.bound([t,""],[Sp(t),""],!1,!0);return Wd(e).J(i).next(s=>{for(const o of s){if(o.collectionId!==t)break;n.push(mt(o.parent))}return n})}addFieldIndex(e,t){const n=Li(e),i=function(c){return{indexId:c.indexId,collectionGroup:c.collectionGroup,fields:c.fields.map(u=>[u.fieldPath.canonicalString(),u.kind])}}(t);delete i.indexId;const s=n.add(i);if(t.indexState){const o=Er(e);return s.next(c=>{o.put(Fd(c,this.uid,t.indexState.sequenceNumber,t.indexState.offset))})}return s.next()}deleteFieldIndex(e,t){const n=Li(e),i=Er(e),s=Ir(e);return n.delete(t.indexId).next(()=>i.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0))).next(()=>s.delete(IDBKeyRange.bound([t.indexId],[t.indexId+1],!1,!0)))}deleteAllFieldIndexes(e){const t=Li(e),n=Ir(e),i=Er(e);return t.Z().next(()=>n.Z()).next(()=>i.Z())}createTargetIndexes(e,t){return A.forEach(this.Mn(t),n=>this.getIndexType(e,n).next(i=>{if(i===0||i===1){const s=new Gd(n).Dn();if(s!=null)return this.addFieldIndex(e,s)}}))}getDocumentsMatchingTarget(e,t){const n=Ir(e);let i=!0;const s=new Map;return A.forEach(this.Mn(t),o=>this.xn(e,o).next(c=>{i&&(i=!!c),s.set(o,c)})).next(()=>{if(i){let o=K();const c=[];return A.forEach(s,(u,l)=>{N(Kd,`Using index ${function(q){return`id=${q.indexId}|cg=${q.collectionGroup}|f=${q.fields.map(ee=>`${ee.fieldPath}:${ee.kind}`).join(",")}`}(u)} to execute ${Yn(t)}`);const f=function(q,ee){const te=Fc(ee);if(te===void 0)return null;for(const X of Fo(q,te.fieldPath))switch(X.op){case"array-contains-any":return X.value.arrayValue.values||[];case"array-contains":return[X.value]}return null}(l,u),p=function(q,ee){const te=new Map;for(const X of Mn(ee))for(const E of Fo(q,X.fieldPath))switch(E.op){case"==":case"in":te.set(X.fieldPath.canonicalString(),E.value);break;case"not-in":case"!=":return te.set(X.fieldPath.canonicalString(),E.value),Array.from(te.values())}return null}(l,u),g=function(q,ee){const te=[];let X=!0;for(const E of Mn(ee)){const _=E.kind===0?Ad(q,E.fieldPath,q.startAt):Rd(q,E.fieldPath,q.startAt);te.push(_.value),X&&(X=_.inclusive)}return new mn(te,X)}(l,u),v=function(q,ee){const te=[];let X=!0;for(const E of Mn(ee)){const _=E.kind===0?Rd(q,E.fieldPath,q.endAt):Ad(q,E.fieldPath,q.endAt);te.push(_.value),X&&(X=_.inclusive)}return new mn(te,X)}(l,u),D=this.On(u,l,g),k=this.On(u,l,v),V=this.Nn(u,l,p),U=this.Bn(u.indexId,f,D,g.inclusive,k,v.inclusive,V);return A.forEach(U,G=>n.Y(G,t.limit).next(q=>{q.forEach(ee=>{const te=x.fromSegments(ee.documentKey);o.has(te)||(o=o.add(te),c.push(te))})}))}).next(()=>c)}return A.resolve(null)})}Mn(e){let t=this.Fn.get(e);return t||(e.filters.length===0?t=[e]:t=Tw(re.create(e.filters,"and")).map(n=>Wc(e.path,e.collectionGroup,e.orderBy,n.getFilters(),e.limit,e.startAt,e.endAt)),this.Fn.set(e,t),t)}Bn(e,t,n,i,s,o,c){const u=(t!=null?t.length:1)*Math.max(n.length,s.length),l=u/(t!=null?t.length:1),f=[];for(let p=0;p<u;++p){const g=t?this.Ln(t[p/l]):lo,v=this.kn(e,g,n[p%l],i),D=this.qn(e,g,s[p%l],o),k=c.map(V=>this.kn(e,g,V,!0));f.push(...this.createRange(v,D,k))}return f}kn(e,t,n,i){const s=new qn(e,x.empty(),t,n);return i?s:s.An()}qn(e,t,n,i){const s=new qn(e,x.empty(),t,n);return i?s.An():s}xn(e,t){const n=new Gd(t),i=t.collectionGroup!=null?t.collectionGroup:t.path.lastSegment();return this.getFieldIndexes(e,i).next(s=>{let o=null;for(const c of s)n.yn(c)&&(!o||c.fields.length>o.fields.length)&&(o=c);return o})}getIndexType(e,t){let n=2;const i=this.Mn(t);return A.forEach(i,s=>this.xn(e,s).next(o=>{o?n!==0&&o.fields.length<function(u){let l=new se(he.comparator),f=!1;for(const p of u.filters)for(const g of p.getFlattenedFilters())g.field.isKeyField()||(g.op==="array-contains"||g.op==="array-contains-any"?f=!0:l=l.add(g.field));for(const p of u.orderBy)p.field.isKeyField()||(l=l.add(p.field));return l.size+(f?1:0)}(s)&&(n=1):n=0})).next(()=>function(o){return o.limit!==null}(t)&&i.length>1&&n===2?1:n)}Qn(e,t){const n=new Mi;for(const i of Mn(e)){const s=t.data.field(i.fieldPath);if(s==null)return null;const o=n.Pn(i.kind);Bn.Kt.Dt(s,o)}return n.un()}Ln(e){const t=new Mi;return Bn.Kt.Dt(e,t.Pn(0)),t.un()}$n(e,t){const n=new Mi;return Bn.Kt.Dt(Jn(this.databaseId,t),n.Pn(function(s){const o=Mn(s);return o.length===0?0:o[o.length-1].kind}(e))),n.un()}Nn(e,t,n){if(n===null)return[];let i=[];i.push(new Mi);let s=0;for(const o of Mn(e)){const c=n[s++];for(const u of i)if(this.Un(t,o.fieldPath)&&_s(c))i=this.Kn(i,o,c);else{const l=u.Pn(o.kind);Bn.Kt.Dt(c,l)}}return this.Wn(i)}On(e,t,n){return this.Nn(e,t,n.position)}Wn(e){const t=[];for(let n=0;n<e.length;++n)t[n]=e[n].un();return t}Kn(e,t,n){const i=[...e],s=[];for(const o of n.arrayValue.values||[])for(const c of i){const u=new Mi;u.seed(c.un()),Bn.Kt.Dt(o,u.Pn(t.kind)),s.push(u)}return s}Un(e,t){return!!e.filters.find(n=>n instanceof Y&&n.field.isEqual(t)&&(n.op==="in"||n.op==="not-in"))}getFieldIndexes(e,t){const n=Li(e),i=Er(e);return(t?n.J(Bc,IDBKeyRange.bound(t,t)):n.J()).next(s=>{const o=[];return A.forEach(s,c=>i.get([c.indexId,this.uid]).next(u=>{o.push(function(f,p){const g=p?new Mr(p.sequenceNumber,new rt(tr(p.readTime),new x(mt(p.documentKey)),p.largestBatchId)):Mr.empty(),v=f.fields.map(([D,k])=>new Gn(he.fromServerFormat(D),k));return new xr(f.indexId,f.collectionGroup,v,g)}(c,u))})).next(()=>o)})}getNextCollectionGroupToUpdate(e){return this.getFieldIndexes(e).next(t=>t.length===0?null:(t.sort((n,i)=>{const s=n.indexState.sequenceNumber-i.indexState.sequenceNumber;return s!==0?s:$(n.collectionGroup,i.collectionGroup)}),t[0].collectionGroup))}updateCollectionGroup(e,t,n){const i=Li(e),s=Er(e);return this.Gn(e).next(o=>i.J(Bc,IDBKeyRange.bound(t,t)).next(c=>A.forEach(c,u=>s.put(Fd(u.indexId,this.uid,o,n)))))}updateIndexEntries(e,t){const n=new Map;return A.forEach(t,(i,s)=>{const o=n.get(i.collectionGroup);return(o?A.resolve(o):this.getFieldIndexes(e,i.collectionGroup)).next(c=>(n.set(i.collectionGroup,c),A.forEach(c,u=>this.zn(e,i,u).next(l=>{const f=this.jn(s,u);return l.isEqual(f)?A.resolve():this.Jn(e,s,u,l,f)}))))})}Hn(e,t,n,i){return Ir(e).put(i.Rn(this.uid,this.$n(n,t.key),t.key))}Yn(e,t,n,i){return Ir(e).delete(i.Vn(this.uid,this.$n(n,t.key),t.key))}zn(e,t,n){const i=Ir(e);let s=new se(Jt);return i.ee({index:Bp,range:IDBKeyRange.only([n.indexId,this.uid,So(this.$n(n,t))])},(o,c)=>{s=s.add(new qn(n.indexId,t,jd(c.arrayValue),jd(c.directionalValue)))}).next(()=>s)}jn(e,t){let n=new se(Jt);const i=this.Qn(t,e);if(i==null)return n;const s=Fc(t);if(s!=null){const o=e.data.field(s.fieldPath);if(_s(o))for(const c of o.arrayValue.values||[])n=n.add(new qn(t.indexId,e.key,this.Ln(c),i))}else n=n.add(new qn(t.indexId,e.key,lo,i));return n}Jn(e,t,n,i,s){N(Kd,"Updating index entries for document '%s'",t.key);const o=[];return function(u,l,f,p,g){const v=u.getIterator(),D=l.getIterator();let k=_r(v),V=_r(D);for(;k||V;){let U=!1,G=!1;if(k&&V){const q=f(k,V);q<0?G=!0:q>0&&(U=!0)}else k!=null?G=!0:U=!0;U?(p(V),V=_r(D)):G?(g(k),k=_r(v)):(k=_r(v),V=_r(D))}}(i,s,Jt,c=>{o.push(this.Hn(e,t,n,c))},c=>{o.push(this.Yn(e,t,n,c))}),A.waitFor(o)}Gn(e){let t=1;return Er(e).ee({index:Up,reverse:!0,range:IDBKeyRange.upperBound([this.uid,Number.MAX_SAFE_INTEGER])},(n,i,s)=>{s.done(),t=i.sequenceNumber+1}).next(()=>t)}createRange(e,t,n){n=n.sort((o,c)=>Jt(o,c)).filter((o,c,u)=>!c||Jt(o,u[c-1])!==0);const i=[];i.push(e);for(const o of n){const c=Jt(o,e),u=Jt(o,t);if(c===0)i[0]=e.An();else if(c>0&&u<0)i.push(o),i.push(o.An());else if(u>0)break}i.push(t);const s=[];for(let o=0;o<i.length;o+=2){if(this.Zn(i[o],i[o+1]))return[];const c=i[o].Vn(this.uid,lo,x.empty()),u=i[o+1].Vn(this.uid,lo,x.empty());s.push(IDBKeyRange.bound(c,u))}return s}Zn(e,t){return Jt(e,t)>0}getMinOffsetFromCollectionGroup(e,t){return this.getFieldIndexes(e,t).next(Hd)}getMinOffset(e,t){return A.mapArray(this.Mn(t),n=>this.xn(e,n).next(i=>i||F(44426))).next(Hd)}}function Wd(r){return Ce(r,fs)}function Ir(r){return Ce(r,Xi)}function Li(r){return Ce(r,Su)}function Er(r){return Ce(r,Yi)}function Hd(r){B(r.length!==0,28825);let e=r[0].indexState.offset,t=e.largestBatchId;for(let n=1;n<r.length;n++){const i=r[n].indexState.offset;vu(i,e)<0&&(e=i),t<i.largestBatchId&&(t=i.largestBatchId)}return new rt(e.readTime,e.documentKey,t)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qd={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},Hm=41943040;class Ue{static withCacheSize(e){return new Ue(e,Ue.DEFAULT_COLLECTION_PERCENTILE,Ue.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,n){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qm(r,e,t){const n=r.store(ot),i=r.store(Lr),s=[],o=IDBKeyRange.only(t.batchId);let c=0;const u=n.ee({range:o},(f,p,g)=>(c++,g.delete()));s.push(u.next(()=>{B(c===1,47070,{batchId:t.batchId})}));const l=[];for(const f of t.mutations){const p=Mp(e,f.key.path,t.batchId);s.push(i.delete(p)),l.push(f.key)}return A.waitFor(s).next(()=>l)}function zo(r){if(!r)return 0;let e;if(r.document)e=r.document;else if(r.unknownDocument)e=r.unknownDocument;else{if(!r.noDocument)throw F(14731);e=r.noDocument}return JSON.stringify(e).length}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Ue.DEFAULT_COLLECTION_PERCENTILE=10,Ue.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Ue.DEFAULT=new Ue(Hm,Ue.DEFAULT_COLLECTION_PERCENTILE,Ue.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Ue.DISABLED=new Ue(-1,0,0);class _a{constructor(e,t,n,i){this.userId=e,this.serializer=t,this.indexManager=n,this.referenceDelegate=i,this.Xn={}}static wt(e,t,n,i){B(e.uid!=="",64387);const s=e.isAuthenticated()?e.uid:"";return new _a(s,t,n,i)}checkEmpty(e){let t=!0;const n=IDBKeyRange.bound([this.userId,Number.NEGATIVE_INFINITY],[this.userId,Number.POSITIVE_INFINITY]);return Yt(e).ee({index:zn,range:n},(i,s,o)=>{t=!1,o.done()}).next(()=>t)}addMutationBatch(e,t,n,i){const s=Rr(e),o=Yt(e);return o.add({}).next(c=>{B(typeof c=="number",49019);const u=new Mu(c,t,n,i),l=function(v,D,k){const V=k.baseMutations.map(G=>Es(v.yt,G)),U=k.mutations.map(G=>Es(v.yt,G));return{userId:D,batchId:k.batchId,localWriteTimeMs:k.localWriteTime.toMillis(),baseMutations:V,mutations:U}}(this.serializer,this.userId,u),f=[];let p=new se((g,v)=>$(g.canonicalString(),v.canonicalString()));for(const g of i){const v=Mp(this.userId,g.key.path,c);p=p.add(g.key.path.popLast()),f.push(o.put(l)),f.push(s.put(v,iT))}return p.forEach(g=>{f.push(this.indexManager.addToCollectionParentIndex(e,g))}),e.addOnCommittedListener(()=>{this.Xn[c]=u.keys()}),A.waitFor(f).next(()=>u)})}lookupMutationBatch(e,t){return Yt(e).get(t).next(n=>n?(B(n.userId===this.userId,48,"Unexpected user for mutation batch",{userId:n.userId,batchId:t}),Un(this.serializer,n)):null)}er(e,t){return this.Xn[t]?A.resolve(this.Xn[t]):this.lookupMutationBatch(e,t).next(n=>{if(n){const i=n.keys();return this.Xn[t]=i,i}return null})}getNextMutationBatchAfterBatchId(e,t){const n=t+1,i=IDBKeyRange.lowerBound([this.userId,n]);let s=null;return Yt(e).ee({index:zn,range:i},(o,c,u)=>{c.userId===this.userId&&(B(c.batchId>=n,47524,{tr:n}),s=Un(this.serializer,c)),u.done()}).next(()=>s)}getHighestUnacknowledgedBatchId(e){const t=IDBKeyRange.upperBound([this.userId,Number.POSITIVE_INFINITY]);let n=an;return Yt(e).ee({index:zn,range:t,reverse:!0},(i,s,o)=>{n=s.batchId,o.done()}).next(()=>n)}getAllMutationBatches(e){const t=IDBKeyRange.bound([this.userId,an],[this.userId,Number.POSITIVE_INFINITY]);return Yt(e).J(zn,t).next(n=>n.map(i=>Un(this.serializer,i)))}getAllMutationBatchesAffectingDocumentKey(e,t){const n=Io(this.userId,t.path),i=IDBKeyRange.lowerBound(n),s=[];return Rr(e).ee({range:i},(o,c,u)=>{const[l,f,p]=o,g=mt(f);if(l===this.userId&&t.path.isEqual(g))return Yt(e).get(p).next(v=>{if(!v)throw F(61480,{nr:o,batchId:p});B(v.userId===this.userId,10503,"Unexpected user for mutation batch",{userId:v.userId,batchId:p}),s.push(Un(this.serializer,v))});u.done()}).next(()=>s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new se($);const i=[];return t.forEach(s=>{const o=Io(this.userId,s.path),c=IDBKeyRange.lowerBound(o),u=Rr(e).ee({range:c},(l,f,p)=>{const[g,v,D]=l,k=mt(v);g===this.userId&&s.path.isEqual(k)?n=n.add(D):p.done()});i.push(u)}),A.waitFor(i).next(()=>this.rr(e,n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,i=n.length+1,s=Io(this.userId,n),o=IDBKeyRange.lowerBound(s);let c=new se($);return Rr(e).ee({range:o},(u,l,f)=>{const[p,g,v]=u,D=mt(g);p===this.userId&&n.isPrefixOf(D)?D.length===i&&(c=c.add(v)):f.done()}).next(()=>this.rr(e,c))}rr(e,t){const n=[],i=[];return t.forEach(s=>{i.push(Yt(e).get(s).next(o=>{if(o===null)throw F(35274,{batchId:s});B(o.userId===this.userId,9748,"Unexpected user for mutation batch",{userId:o.userId,batchId:s}),n.push(Un(this.serializer,o))}))}),A.waitFor(i).next(()=>n)}removeMutationBatch(e,t){return Qm(e.le,this.userId,t).next(n=>(e.addOnCommittedListener(()=>{this.ir(t.batchId)}),A.forEach(n,i=>this.referenceDelegate.markPotentiallyOrphaned(e,i))))}ir(e){delete this.Xn[e]}performConsistencyCheck(e){return this.checkEmpty(e).next(t=>{if(!t)return A.resolve();const n=IDBKeyRange.lowerBound(function(o){return[o]}(this.userId)),i=[];return Rr(e).ee({range:n},(s,o,c)=>{if(s[0]===this.userId){const u=mt(s[1]);i.push(u)}else c.done()}).next(()=>{B(i.length===0,56720,{sr:i.map(s=>s.canonicalString())})})})}containsKey(e,t){return Jm(e,this.userId,t)}_r(e){return Ym(e).get(this.userId).next(t=>t||{userId:this.userId,lastAcknowledgedBatchId:an,lastStreamToken:""})}}function Jm(r,e,t){const n=Io(e,t.path),i=n[1],s=IDBKeyRange.lowerBound(n);let o=!1;return Rr(r).ee({range:s,X:!0},(c,u,l)=>{const[f,p,g]=c;f===e&&p===i&&(o=!0),l.done()}).next(()=>o)}function Yt(r){return Ce(r,ot)}function Rr(r){return Ce(r,Lr)}function Ym(r){return Ce(r,hs)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nr{constructor(e){this.ar=e}next(){return this.ar+=2,this.ar}static ur(){return new nr(0)}static cr(){return new nr(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Aw{constructor(e,t){this.referenceDelegate=e,this.serializer=t}allocateTargetId(e){return this.lr(e).next(t=>{const n=new nr(t.highestTargetId);return t.highestTargetId=n.next(),this.hr(e,t).next(()=>t.highestTargetId)})}getLastRemoteSnapshotVersion(e){return this.lr(e).next(t=>j.fromTimestamp(new ne(t.lastRemoteSnapshotVersion.seconds,t.lastRemoteSnapshotVersion.nanoseconds)))}getHighestSequenceNumber(e){return this.lr(e).next(t=>t.highestListenSequenceNumber)}setTargetsMetadata(e,t,n){return this.lr(e).next(i=>(i.highestListenSequenceNumber=t,n&&(i.lastRemoteSnapshotVersion=n.toTimestamp()),t>i.highestListenSequenceNumber&&(i.highestListenSequenceNumber=t),this.hr(e,i)))}addTargetData(e,t){return this.Pr(e,t).next(()=>this.lr(e).next(n=>(n.targetCount+=1,this.Tr(t,n),this.hr(e,n))))}updateTargetData(e,t){return this.Pr(e,t)}removeTargetData(e,t){return this.removeMatchingKeysForTargetId(e,t.targetId).next(()=>Tr(e).delete(t.targetId)).next(()=>this.lr(e)).next(n=>(B(n.targetCount>0,8065),n.targetCount-=1,this.hr(e,n)))}removeTargets(e,t,n){let i=0;const s=[];return Tr(e).ee((o,c)=>{const u=Ki(c);u.sequenceNumber<=t&&n.get(u.targetId)===null&&(i++,s.push(this.removeTargetData(e,u)))}).next(()=>A.waitFor(s)).next(()=>i)}forEachTarget(e,t){return Tr(e).ee((n,i)=>{const s=Ki(i);t(s)})}lr(e){return Jd(e).get(Mo).next(t=>(B(t!==null,2888),t))}hr(e,t){return Jd(e).put(Mo,t)}Pr(e,t){return Tr(e).put($m(this.serializer,t))}Tr(e,t){let n=!1;return e.targetId>t.highestTargetId&&(t.highestTargetId=e.targetId,n=!0),e.sequenceNumber>t.highestListenSequenceNumber&&(t.highestListenSequenceNumber=e.sequenceNumber,n=!0),n}getTargetCount(e){return this.lr(e).next(t=>t.targetCount)}getTargetData(e,t){const n=Yn(t),i=IDBKeyRange.bound([n,Number.NEGATIVE_INFINITY],[n,Number.POSITIVE_INFINITY]);let s=null;return Tr(e).ee({range:i,index:Fp},(o,c,u)=>{const l=Ki(c);Ds(t,l.target)&&(s=l,u.done())}).next(()=>s)}addMatchingKeys(e,t,n){const i=[],s=tn(e);return t.forEach(o=>{const c=Be(o.path);i.push(s.put({targetId:n,path:c})),i.push(this.referenceDelegate.addReference(e,n,o))}),A.waitFor(i)}removeMatchingKeys(e,t,n){const i=tn(e);return A.forEach(t,s=>{const o=Be(s.path);return A.waitFor([i.delete([n,o]),this.referenceDelegate.removeReference(e,n,s)])})}removeMatchingKeysForTargetId(e,t){const n=tn(e),i=IDBKeyRange.bound([t],[t+1],!1,!0);return n.delete(i)}getMatchingKeysForTargetId(e,t){const n=IDBKeyRange.bound([t],[t+1],!1,!0),i=tn(e);let s=K();return i.ee({range:n,X:!0},(o,c,u)=>{const l=mt(o[1]),f=new x(l);s=s.add(f)}).next(()=>s)}containsKey(e,t){const n=Be(t.path),i=IDBKeyRange.bound([n],[Sp(n)],!1,!0);let s=0;return tn(e).ee({index:Ru,X:!0,range:i},([o,c],u,l)=>{o!==0&&(s++,l.done())}).next(()=>s>0)}At(e,t){return Tr(e).get(t).next(n=>n?Ki(n):null)}}function Tr(r){return Ce(r,Fr)}function Jd(r){return Ce(r,$n)}function tn(r){return Ce(r,Ur)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yd="LruGarbageCollector",Xm=1048576;function Xd([r,e],[t,n]){const i=$(r,t);return i===0?$(e,n):i}class Rw{constructor(e){this.Ir=e,this.buffer=new se(Xd),this.Er=0}dr(){return++this.Er}Ar(e){const t=[e,this.dr()];if(this.buffer.size<this.Ir)this.buffer=this.buffer.add(t);else{const n=this.buffer.last();Xd(t,n)<0&&(this.buffer=this.buffer.delete(n).add(t))}}get maxValue(){return this.buffer.last()[0]}}class Zm{constructor(e,t,n){this.garbageCollector=e,this.asyncQueue=t,this.localStore=n,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Vr(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Vr(e){N(Yd,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(t){En(t)?N(Yd,"Ignoring IndexedDB error during garbage collection: ",t):await In(t)}await this.Vr(3e5)})}}class Sw{constructor(e,t){this.mr=e,this.params=t}calculateTargetCount(e,t){return this.mr.gr(e).next(n=>Math.floor(t/100*n))}nthSequenceNumber(e,t){if(t===0)return A.resolve(We.ce);const n=new Rw(t);return this.mr.forEachTarget(e,i=>n.Ar(i.sequenceNumber)).next(()=>this.mr.pr(e,i=>n.Ar(i))).next(()=>n.maxValue)}removeTargets(e,t,n){return this.mr.removeTargets(e,t,n)}removeOrphanedDocuments(e,t){return this.mr.removeOrphanedDocuments(e,t)}collect(e,t){return this.params.cacheSizeCollectionThreshold===-1?(N("LruGarbageCollector","Garbage collection skipped; disabled"),A.resolve(Qd)):this.getCacheSize(e).next(n=>n<this.params.cacheSizeCollectionThreshold?(N("LruGarbageCollector",`Garbage collection skipped; Cache size ${n} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),Qd):this.yr(e,t))}getCacheSize(e){return this.mr.getCacheSize(e)}yr(e,t){let n,i,s,o,c,u,l;const f=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(p=>(p>this.params.maximumSequenceNumbersToCollect?(N("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${p}`),i=this.params.maximumSequenceNumbersToCollect):i=p,o=Date.now(),this.nthSequenceNumber(e,i))).next(p=>(n=p,c=Date.now(),this.removeTargets(e,n,t))).next(p=>(s=p,u=Date.now(),this.removeOrphanedDocuments(e,n))).next(p=>(l=Date.now(),wr()<=J.DEBUG&&N("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-f}ms
	Determined least recently used ${i} in `+(c-o)+`ms
	Removed ${s} targets in `+(u-c)+`ms
	Removed ${p} documents in `+(l-u)+`ms
Total Duration: ${l-f}ms`),A.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:s,documentsRemoved:p})))}}function eg(r,e){return new Sw(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bw{constructor(e,t){this.db=e,this.garbageCollector=eg(this,t)}gr(e){const t=this.wr(e);return this.db.getTargetCache().getTargetCount(e).next(n=>t.next(i=>n+i))}wr(e){let t=0;return this.pr(e,n=>{t++}).next(()=>t)}forEachTarget(e,t){return this.db.getTargetCache().forEachTarget(e,t)}pr(e,t){return this.Sr(e,(n,i)=>t(i))}addReference(e,t,n){return ho(e,n)}removeReference(e,t,n){return ho(e,n)}removeTargets(e,t,n){return this.db.getTargetCache().removeTargets(e,t,n)}markPotentiallyOrphaned(e,t){return ho(e,t)}br(e,t){return function(i,s){let o=!1;return Ym(i).te(c=>Jm(i,c,s).next(u=>(u&&(o=!0),A.resolve(!u)))).next(()=>o)}(e,t)}removeOrphanedDocuments(e,t){const n=this.db.getRemoteDocumentCache().newChangeBuffer(),i=[];let s=0;return this.Sr(e,(o,c)=>{if(c<=t){const u=this.br(e,o).next(l=>{if(!l)return s++,n.getEntry(e,o).next(()=>(n.removeEntry(o,j.min()),tn(e).delete(function(p){return[0,Be(p.path)]}(o))))});i.push(u)}}).next(()=>A.waitFor(i)).next(()=>n.apply(e)).next(()=>s)}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.db.getTargetCache().updateTargetData(e,n)}updateLimboDocument(e,t){return ho(e,t)}Sr(e,t){const n=tn(e);let i,s=We.ce;return n.ee({index:Ru},([o,c],{path:u,sequenceNumber:l})=>{o===0?(s!==We.ce&&t(new x(mt(i)),s),s=l,i=u):s=We.ce}).next(()=>{s!==We.ce&&t(new x(mt(i)),s)})}getCacheSize(e){return this.db.getRemoteDocumentCache().getSize(e)}}function ho(r,e){return tn(r).put(function(n,i){return{targetId:0,path:Be(n.path),sequenceNumber:i}}(e,r.currentSequenceNumber))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tg{constructor(){this.changes=new Ut(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,le.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();const n=this.changes.get(t);return n!==void 0?A.resolve(n):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pw{constructor(e){this.serializer=e}setIndexManager(e){this.indexManager=e}addEntry(e,t,n){return On(e).put(n)}removeEntry(e,t,n){return On(e).delete(function(s,o){const c=s.path.toArray();return[c.slice(0,c.length-2),c[c.length-2],Bo(o),c[c.length-1]]}(t,n))}updateMetadata(e,t){return this.getMetadata(e).next(n=>(n.byteSize+=t,this.Dr(e,n)))}getEntry(e,t){let n=le.newInvalidDocument(t);return On(e).ee({index:Eo,range:IDBKeyRange.only(Fi(t))},(i,s)=>{n=this.Cr(t,s)}).next(()=>n)}vr(e,t){let n={size:0,document:le.newInvalidDocument(t)};return On(e).ee({index:Eo,range:IDBKeyRange.only(Fi(t))},(i,s)=>{n={document:this.Cr(t,s),size:zo(s)}}).next(()=>n)}getEntries(e,t){let n=Qe();return this.Fr(e,t,(i,s)=>{const o=this.Cr(i,s);n=n.insert(i,o)}).next(()=>n)}Mr(e,t){let n=Qe(),i=new ce(x.comparator);return this.Fr(e,t,(s,o)=>{const c=this.Cr(s,o);n=n.insert(s,c),i=i.insert(s,zo(o))}).next(()=>({documents:n,Or:i}))}Fr(e,t,n){if(t.isEmpty())return A.resolve();let i=new se(tf);t.forEach(u=>i=i.add(u));const s=IDBKeyRange.bound(Fi(i.first()),Fi(i.last())),o=i.getIterator();let c=o.getNext();return On(e).ee({index:Eo,range:s},(u,l,f)=>{const p=x.fromSegments([...l.prefixPath,l.collectionGroup,l.documentId]);for(;c&&tf(c,p)<0;)n(c,null),c=o.getNext();c&&c.isEqual(p)&&(n(c,l),c=o.hasNext()?o.getNext():null),c?f.j(Fi(c)):f.done()}).next(()=>{for(;c;)n(c,null),c=o.hasNext()?o.getNext():null})}getDocumentsMatchingQuery(e,t,n,i,s){const o=t.path,c=[o.popLast().toArray(),o.lastSegment(),Bo(n.readTime),n.documentKey.path.isEmpty()?"":n.documentKey.path.lastSegment()],u=[o.popLast().toArray(),o.lastSegment(),[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],""];return On(e).J(IDBKeyRange.bound(c,u,!0)).next(l=>{s?.incrementDocumentReadCount(l.length);let f=Qe();for(const p of l){const g=this.Cr(x.fromSegments(p.prefixPath.concat(p.collectionGroup,p.documentId)),p);g.isFoundDocument()&&(Vs(t,g)||i.has(g.key))&&(f=f.insert(g.key,g))}return f})}getAllFromCollectionGroup(e,t,n,i){let s=Qe();const o=ef(t,n),c=ef(t,rt.max());return On(e).ee({index:Lp,range:IDBKeyRange.bound(o,c,!0)},(u,l,f)=>{const p=this.Cr(x.fromSegments(l.prefixPath.concat(l.collectionGroup,l.documentId)),l);s=s.insert(p.key,p),s.size===i&&f.done()}).next(()=>s)}newChangeBuffer(e){return new Cw(this,!!e&&e.trackRemovals)}getSize(e){return this.getMetadata(e).next(t=>t.byteSize)}getMetadata(e){return Zd(e).get(Uc).next(t=>(B(!!t,20021),t))}Dr(e,t){return Zd(e).put(Uc,t)}Cr(e,t){if(t){const n=pw(this.serializer,t);if(!(n.isNoDocument()&&n.version.isEqual(j.min())))return n}return le.newInvalidDocument(e)}}function ng(r){return new Pw(r)}class Cw extends tg{constructor(e,t){super(),this.Nr=e,this.trackRemovals=t,this.Br=new Ut(n=>n.toString(),(n,i)=>n.isEqual(i))}applyChanges(e){const t=[];let n=0,i=new se((s,o)=>$(s.canonicalString(),o.canonicalString()));return this.changes.forEach((s,o)=>{const c=this.Br.get(s);if(t.push(this.Nr.removeEntry(e,s,c.readTime)),o.isValidDocument()){const u=Md(this.Nr.serializer,o);i=i.add(s.path.popLast());const l=zo(u);n+=l-c.size,t.push(this.Nr.addEntry(e,s,u))}else if(n-=c.size,this.trackRemovals){const u=Md(this.Nr.serializer,o.convertToNoDocument(j.min()));t.push(this.Nr.addEntry(e,s,u))}}),i.forEach(s=>{t.push(this.Nr.indexManager.addToCollectionParentIndex(e,s))}),t.push(this.Nr.updateMetadata(e,n)),A.waitFor(t)}getFromCache(e,t){return this.Nr.vr(e,t).next(n=>(this.Br.set(t,{size:n.size,readTime:n.document.readTime}),n.document))}getAllFromCache(e,t){return this.Nr.Mr(e,t).next(({documents:n,Or:i})=>(i.forEach((s,o)=>{this.Br.set(s,{size:o,readTime:n.get(s).readTime})}),n))}}function Zd(r){return Ce(r,ds)}function On(r){return Ce(r,xo)}function Fi(r){const e=r.path.toArray();return[e.slice(0,e.length-2),e[e.length-2],e[e.length-1]]}function ef(r,e){const t=e.documentKey.path.toArray();return[r,Bo(e.readTime),t.slice(0,t.length-2),t.length>0?t[t.length-1]:""]}function tf(r,e){const t=r.path.toArray(),n=e.path.toArray();let i=0;for(let s=0;s<t.length-2&&s<n.length-2;++s)if(i=$(t[s],n[s]),i)return i;return i=$(t.length,n.length),i||(i=$(t[t.length-2],n[n.length-2]),i||$(t[t.length-1],n[n.length-1]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dw{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rg{constructor(e,t,n,i){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=n,this.indexManager=i}getDocument(e,t){let n=null;return this.documentOverlayCache.getOverlay(e,t).next(i=>(n=i,this.remoteDocumentCache.getEntry(e,t))).next(i=>(n!==null&&ts(n.mutation,i,He.empty(),ne.now()),i))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.getLocalViewOfDocuments(e,n,K()).next(()=>n))}getLocalViewOfDocuments(e,t,n=K()){const i=gt();return this.populateOverlays(e,i,t).next(()=>this.computeViews(e,t,i,n).next(s=>{let o=Gi();return s.forEach((c,u)=>{o=o.insert(c,u.overlayedDocument)}),o}))}getOverlayedDocuments(e,t){const n=gt();return this.populateOverlays(e,n,t).next(()=>this.computeViews(e,t,n,K()))}populateOverlays(e,t,n){const i=[];return n.forEach(s=>{t.has(s)||i.push(s)}),this.documentOverlayCache.getOverlays(e,i).next(s=>{s.forEach((o,c)=>{t.set(o,c)})})}computeViews(e,t,n,i){let s=Qe();const o=es(),c=function(){return es()}();return t.forEach((u,l)=>{const f=n.get(l.key);i.has(l.key)&&(f===void 0||f.mutation instanceof Bt)?s=s.insert(l.key,l):f!==void 0?(o.set(l.key,f.mutation.getFieldMask()),ts(f.mutation,l,f.mutation.getFieldMask(),ne.now())):o.set(l.key,He.empty())}),this.recalculateAndSaveOverlays(e,s).next(u=>(u.forEach((l,f)=>o.set(l,f)),t.forEach((l,f)=>c.set(l,new Dw(f,o.get(l)??null))),c))}recalculateAndSaveOverlays(e,t){const n=es();let i=new ce((o,c)=>o-c),s=K();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(o=>{for(const c of o)c.keys().forEach(u=>{const l=t.get(u);if(l===null)return;let f=n.get(u)||He.empty();f=c.applyToLocalView(l,f),n.set(u,f);const p=(i.get(c.batchId)||K()).add(u);i=i.insert(c.batchId,p)})}).next(()=>{const o=[],c=i.getReverseIterator();for(;c.hasNext();){const u=c.getNext(),l=u.key,f=u.value,p=ym();f.forEach(g=>{if(!s.has(g)){const v=Rm(t.get(g),n.get(g));v!==null&&p.set(g,v),s=s.add(g)}}),o.push(this.documentOverlayCache.saveOverlays(e,l,p))}return A.waitFor(o)}).next(()=>n)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(n=>this.recalculateAndSaveOverlays(e,n))}getDocumentsMatchingQuery(e,t,n,i){return function(o){return x.isDocumentKey(o.path)&&o.collectionGroup===null&&o.filters.length===0}(t)?this.getDocumentsMatchingDocumentQuery(e,t.path):Vu(t)?this.getDocumentsMatchingCollectionGroupQuery(e,t,n,i):this.getDocumentsMatchingCollectionQuery(e,t,n,i)}getNextDocuments(e,t,n,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,n,i).next(s=>{const o=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,n.largestBatchId,i-s.size):A.resolve(gt());let c=Or,u=s;return o.next(l=>A.forEach(l,(f,p)=>(c<p.largestBatchId&&(c=p.largestBatchId),s.get(f)?A.resolve():this.remoteDocumentCache.getEntry(e,f).next(g=>{u=u.insert(f,g)}))).next(()=>this.populateOverlays(e,l,s)).next(()=>this.computeViews(e,u,l,K())).next(f=>({batchId:c,changes:_m(f)})))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new x(t)).next(n=>{let i=Gi();return n.isFoundDocument()&&(i=i.insert(n.key,n)),i})}getDocumentsMatchingCollectionGroupQuery(e,t,n,i){const s=t.collectionGroup;let o=Gi();return this.indexManager.getCollectionParents(e,s).next(c=>A.forEach(c,u=>{const l=function(p,g){return new Ft(g,null,p.explicitOrderBy.slice(),p.filters.slice(),p.limit,p.limitType,p.startAt,p.endAt)}(t,u.child(s));return this.getDocumentsMatchingCollectionQuery(e,l,n,i).next(f=>{f.forEach((p,g)=>{o=o.insert(p,g)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,t,n,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,n.largestBatchId).next(o=>(s=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,n,s,i))).next(o=>{s.forEach((u,l)=>{const f=l.getKey();o.get(f)===null&&(o=o.insert(f,le.newInvalidDocument(f)))});let c=Gi();return o.forEach((u,l)=>{const f=s.get(u);f!==void 0&&ts(f.mutation,l,He.empty(),ne.now()),Vs(t,l)&&(c=c.insert(u,l))}),c})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class kw{constructor(e){this.serializer=e,this.Lr=new Map,this.kr=new Map}getBundleMetadata(e,t){return A.resolve(this.Lr.get(t))}saveBundleMetadata(e,t){return this.Lr.set(t.id,function(i){return{id:i.id,version:i.version,createTime:we(i.createTime)}}(t)),A.resolve()}getNamedQuery(e,t){return A.resolve(this.kr.get(t))}saveNamedQuery(e,t){return this.kr.set(t.name,function(i){return{name:i.name,query:ma(i.bundledQuery),readTime:we(i.readTime)}}(t)),A.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vw{constructor(){this.overlays=new ce(x.comparator),this.qr=new Map}getOverlay(e,t){return A.resolve(this.overlays.get(t))}getOverlays(e,t){const n=gt();return A.forEach(t,i=>this.getOverlay(e,i).next(s=>{s!==null&&n.set(i,s)})).next(()=>n)}saveOverlays(e,t,n){return n.forEach((i,s)=>{this.St(e,t,s)}),A.resolve()}removeOverlaysForBatchId(e,t,n){const i=this.qr.get(n);return i!==void 0&&(i.forEach(s=>this.overlays=this.overlays.remove(s)),this.qr.delete(n)),A.resolve()}getOverlaysForCollection(e,t,n){const i=gt(),s=t.length+1,o=new x(t.child("")),c=this.overlays.getIteratorFrom(o);for(;c.hasNext();){const u=c.getNext().value,l=u.getKey();if(!t.isPrefixOf(l.path))break;l.path.length===s&&u.largestBatchId>n&&i.set(u.getKey(),u)}return A.resolve(i)}getOverlaysForCollectionGroup(e,t,n,i){let s=new ce((l,f)=>l-f);const o=this.overlays.getIterator();for(;o.hasNext();){const l=o.getNext().value;if(l.getKey().getCollectionGroup()===t&&l.largestBatchId>n){let f=s.get(l.largestBatchId);f===null&&(f=gt(),s=s.insert(l.largestBatchId,f)),f.set(l.getKey(),l)}}const c=gt(),u=s.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((l,f)=>c.set(l,f)),!(c.size()>=i)););return A.resolve(c)}St(e,t,n){const i=this.overlays.get(n.key);if(i!==null){const o=this.qr.get(i.largestBatchId).delete(n.key);this.qr.set(i.largestBatchId,o)}this.overlays=this.overlays.insert(n.key,new Fu(t,n));let s=this.qr.get(t);s===void 0&&(s=K(),this.qr.set(t,s)),this.qr.set(t,s.add(n.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nw{constructor(){this.sessionToken=ye.EMPTY_BYTE_STRING}getSessionToken(e){return A.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,A.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ju{constructor(){this.Qr=new se(ke.$r),this.Ur=new se(ke.Kr)}isEmpty(){return this.Qr.isEmpty()}addReference(e,t){const n=new ke(e,t);this.Qr=this.Qr.add(n),this.Ur=this.Ur.add(n)}Wr(e,t){e.forEach(n=>this.addReference(n,t))}removeReference(e,t){this.Gr(new ke(e,t))}zr(e,t){e.forEach(n=>this.removeReference(n,t))}jr(e){const t=new x(new H([])),n=new ke(t,e),i=new ke(t,e+1),s=[];return this.Ur.forEachInRange([n,i],o=>{this.Gr(o),s.push(o.key)}),s}Jr(){this.Qr.forEach(e=>this.Gr(e))}Gr(e){this.Qr=this.Qr.delete(e),this.Ur=this.Ur.delete(e)}Hr(e){const t=new x(new H([])),n=new ke(t,e),i=new ke(t,e+1);let s=K();return this.Ur.forEachInRange([n,i],o=>{s=s.add(o.key)}),s}containsKey(e){const t=new ke(e,0),n=this.Qr.firstAfterOrEqual(t);return n!==null&&e.isEqual(n.key)}}class ke{constructor(e,t){this.key=e,this.Yr=t}static $r(e,t){return x.comparator(e.key,t.key)||$(e.Yr,t.Yr)}static Kr(e,t){return $(e.Yr,t.Yr)||x.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ow{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.tr=1,this.Zr=new se(ke.$r)}checkEmpty(e){return A.resolve(this.mutationQueue.length===0)}addMutationBatch(e,t,n,i){const s=this.tr;this.tr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new Mu(s,t,n,i);this.mutationQueue.push(o);for(const c of i)this.Zr=this.Zr.add(new ke(c.key,s)),this.indexManager.addToCollectionParentIndex(e,c.key.path.popLast());return A.resolve(o)}lookupMutationBatch(e,t){return A.resolve(this.Xr(t))}getNextMutationBatchAfterBatchId(e,t){const n=t+1,i=this.ei(n),s=i<0?0:i;return A.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return A.resolve(this.mutationQueue.length===0?an:this.tr-1)}getAllMutationBatches(e){return A.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){const n=new ke(t,0),i=new ke(t,Number.POSITIVE_INFINITY),s=[];return this.Zr.forEachInRange([n,i],o=>{const c=this.Xr(o.Yr);s.push(c)}),A.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,t){let n=new se($);return t.forEach(i=>{const s=new ke(i,0),o=new ke(i,Number.POSITIVE_INFINITY);this.Zr.forEachInRange([s,o],c=>{n=n.add(c.Yr)})}),A.resolve(this.ti(n))}getAllMutationBatchesAffectingQuery(e,t){const n=t.path,i=n.length+1;let s=n;x.isDocumentKey(s)||(s=s.child(""));const o=new ke(new x(s),0);let c=new se($);return this.Zr.forEachWhile(u=>{const l=u.key.path;return!!n.isPrefixOf(l)&&(l.length===i&&(c=c.add(u.Yr)),!0)},o),A.resolve(this.ti(c))}ti(e){const t=[];return e.forEach(n=>{const i=this.Xr(n);i!==null&&t.push(i)}),t}removeMutationBatch(e,t){B(this.ni(t.batchId,"removed")===0,55003),this.mutationQueue.shift();let n=this.Zr;return A.forEach(t.mutations,i=>{const s=new ke(i.key,t.batchId);return n=n.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Zr=n})}ir(e){}containsKey(e,t){const n=new ke(t,0),i=this.Zr.firstAfterOrEqual(n);return A.resolve(t.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,A.resolve()}ni(e,t){return this.ei(e)}ei(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Xr(e){const t=this.ei(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xw{constructor(e){this.ri=e,this.docs=function(){return new ce(x.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){const n=t.key,i=this.docs.get(n),s=i?i.size:0,o=this.ri(t);return this.docs=this.docs.insert(n,{document:t.mutableCopy(),size:o}),this.size+=o-s,this.indexManager.addToCollectionParentIndex(e,n.path.popLast())}removeEntry(e){const t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){const n=this.docs.get(t);return A.resolve(n?n.document.mutableCopy():le.newInvalidDocument(t))}getEntries(e,t){let n=Qe();return t.forEach(i=>{const s=this.docs.get(i);n=n.insert(i,s?s.document.mutableCopy():le.newInvalidDocument(i))}),A.resolve(n)}getDocumentsMatchingQuery(e,t,n,i){let s=Qe();const o=t.path,c=new x(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(c);for(;u.hasNext();){const{key:l,value:{document:f}}=u.getNext();if(!o.isPrefixOf(l.path))break;l.path.length>o.length+1||vu(kp(f),n)<=0||(i.has(f.key)||Vs(t,f))&&(s=s.insert(f.key,f.mutableCopy()))}return A.resolve(s)}getAllFromCollectionGroup(e,t,n,i){F(9500)}ii(e,t){return A.forEach(this.docs,n=>t(n))}newChangeBuffer(e){return new Mw(this)}getSize(e){return A.resolve(this.size)}}class Mw extends tg{constructor(e){super(),this.Nr=e}applyChanges(e){const t=[];return this.changes.forEach((n,i)=>{i.isValidDocument()?t.push(this.Nr.addEntry(e,i)):this.Nr.removeEntry(n)}),A.waitFor(t)}getFromCache(e,t){return this.Nr.getEntry(e,t)}getAllFromCache(e,t){return this.Nr.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lw{constructor(e){this.persistence=e,this.si=new Ut(t=>Yn(t),Ds),this.lastRemoteSnapshotVersion=j.min(),this.highestTargetId=0,this.oi=0,this._i=new ju,this.targetCount=0,this.ai=nr.ur()}forEachTarget(e,t){return this.si.forEach((n,i)=>t(i)),A.resolve()}getLastRemoteSnapshotVersion(e){return A.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return A.resolve(this.oi)}allocateTargetId(e){return this.highestTargetId=this.ai.next(),A.resolve(this.highestTargetId)}setTargetsMetadata(e,t,n){return n&&(this.lastRemoteSnapshotVersion=n),t>this.oi&&(this.oi=t),A.resolve()}Pr(e){this.si.set(e.target,e);const t=e.targetId;t>this.highestTargetId&&(this.ai=new nr(t),this.highestTargetId=t),e.sequenceNumber>this.oi&&(this.oi=e.sequenceNumber)}addTargetData(e,t){return this.Pr(t),this.targetCount+=1,A.resolve()}updateTargetData(e,t){return this.Pr(t),A.resolve()}removeTargetData(e,t){return this.si.delete(t.target),this._i.jr(t.targetId),this.targetCount-=1,A.resolve()}removeTargets(e,t,n){let i=0;const s=[];return this.si.forEach((o,c)=>{c.sequenceNumber<=t&&n.get(c.targetId)===null&&(this.si.delete(o),s.push(this.removeMatchingKeysForTargetId(e,c.targetId)),i++)}),A.waitFor(s).next(()=>i)}getTargetCount(e){return A.resolve(this.targetCount)}getTargetData(e,t){const n=this.si.get(t)||null;return A.resolve(n)}addMatchingKeys(e,t,n){return this._i.Wr(t,n),A.resolve()}removeMatchingKeys(e,t,n){this._i.zr(t,n);const i=this.persistence.referenceDelegate,s=[];return i&&t.forEach(o=>{s.push(i.markPotentiallyOrphaned(e,o))}),A.waitFor(s)}removeMatchingKeysForTargetId(e,t){return this._i.jr(t),A.resolve()}getMatchingKeysForTargetId(e,t){const n=this._i.Hr(t);return A.resolve(n)}containsKey(e,t){return A.resolve(this._i.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gu{constructor(e,t){this.ui={},this.overlays={},this.ci=new We(0),this.li=!1,this.li=!0,this.hi=new Nw,this.referenceDelegate=e(this),this.Pi=new Lw(this),this.indexManager=new ww,this.remoteDocumentCache=function(i){return new xw(i)}(n=>this.referenceDelegate.Ti(n)),this.serializer=new Gm(t),this.Ii=new kw(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.li=!1,Promise.resolve()}get started(){return this.li}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new Vw,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let n=this.ui[e.toKey()];return n||(n=new Ow(t,this.referenceDelegate),this.ui[e.toKey()]=n),n}getGlobalsCache(){return this.hi}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ii}runTransaction(e,t,n){N("MemoryPersistence","Starting transaction:",e);const i=new Fw(this.ci.next());return this.referenceDelegate.Ei(),n(i).next(s=>this.referenceDelegate.di(i).next(()=>s)).toPromise().then(s=>(i.raiseOnCommittedEvent(),s))}Ai(e,t){return A.or(Object.values(this.ui).map(n=>()=>n.containsKey(e,t)))}}class Fw extends Np{constructor(e){super(),this.currentSequenceNumber=e}}class ya{constructor(e){this.persistence=e,this.Ri=new ju,this.Vi=null}static mi(e){return new ya(e)}get fi(){if(this.Vi)return this.Vi;throw F(60996)}addReference(e,t,n){return this.Ri.addReference(n,t),this.fi.delete(n.toString()),A.resolve()}removeReference(e,t,n){return this.Ri.removeReference(n,t),this.fi.add(n.toString()),A.resolve()}markPotentiallyOrphaned(e,t){return this.fi.add(t.toString()),A.resolve()}removeTarget(e,t){this.Ri.jr(t.targetId).forEach(i=>this.fi.add(i.toString()));const n=this.persistence.getTargetCache();return n.getMatchingKeysForTargetId(e,t.targetId).next(i=>{i.forEach(s=>this.fi.add(s.toString()))}).next(()=>n.removeTargetData(e,t))}Ei(){this.Vi=new Set}di(e){const t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return A.forEach(this.fi,n=>{const i=x.fromPath(n);return this.gi(e,i).next(s=>{s||t.removeEntry(i,j.min())})}).next(()=>(this.Vi=null,t.apply(e)))}updateLimboDocument(e,t){return this.gi(e,t).next(n=>{n?this.fi.delete(t.toString()):this.fi.add(t.toString())})}Ti(e){return 0}gi(e,t){return A.or([()=>A.resolve(this.Ri.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ai(e,t)])}}class jo{constructor(e,t){this.persistence=e,this.pi=new Ut(n=>Be(n.path),(n,i)=>n.isEqual(i)),this.garbageCollector=eg(this,t)}static mi(e,t){return new jo(e,t)}Ei(){}di(e){return A.resolve()}forEachTarget(e,t){return this.persistence.getTargetCache().forEachTarget(e,t)}gr(e){const t=this.wr(e);return this.persistence.getTargetCache().getTargetCount(e).next(n=>t.next(i=>n+i))}wr(e){let t=0;return this.pr(e,n=>{t++}).next(()=>t)}pr(e,t){return A.forEach(this.pi,(n,i)=>this.br(e,n,i).next(s=>s?A.resolve():t(i)))}removeTargets(e,t,n){return this.persistence.getTargetCache().removeTargets(e,t,n)}removeOrphanedDocuments(e,t){let n=0;const i=this.persistence.getRemoteDocumentCache(),s=i.newChangeBuffer();return i.ii(e,o=>this.br(e,o,t).next(c=>{c||(n++,s.removeEntry(o,j.min()))})).next(()=>s.apply(e)).next(()=>n)}markPotentiallyOrphaned(e,t){return this.pi.set(t,e.currentSequenceNumber),A.resolve()}removeTarget(e,t){const n=t.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,n)}addReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),A.resolve()}removeReference(e,t,n){return this.pi.set(n,e.currentSequenceNumber),A.resolve()}updateLimboDocument(e,t){return this.pi.set(t,e.currentSequenceNumber),A.resolve()}Ti(e){let t=e.key.toString().length;return e.isFoundDocument()&&(t+=wo(e.data.value)),t}br(e,t,n){return A.or([()=>this.persistence.Ai(e,t),()=>this.persistence.getTargetCache().containsKey(e,t),()=>{const i=this.pi.get(t);return A.resolve(i!==void 0&&i>n)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uw{constructor(e){this.serializer=e}k(e,t,n,i){const s=new ia("createOrUpgrade",t);n<1&&i>=1&&(function(u){u.createObjectStore(Cs)}(e),function(u){u.createObjectStore(hs,{keyPath:rT}),u.createObjectStore(ot,{keyPath:dd,autoIncrement:!0}).createIndex(zn,fd,{unique:!0}),u.createObjectStore(Lr)}(e),nf(e),function(u){u.createObjectStore(Ln)}(e));let o=A.resolve();return n<3&&i>=3&&(n!==0&&(function(u){u.deleteObjectStore(Ur),u.deleteObjectStore(Fr),u.deleteObjectStore($n)}(e),nf(e)),o=o.next(()=>function(u){const l=u.store($n),f={highestTargetId:0,highestListenSequenceNumber:0,lastRemoteSnapshotVersion:j.min().toTimestamp(),targetCount:0};return l.put(Mo,f)}(s))),n<4&&i>=4&&(n!==0&&(o=o.next(()=>function(u,l){return l.store(ot).J().next(p=>{u.deleteObjectStore(ot),u.createObjectStore(ot,{keyPath:dd,autoIncrement:!0}).createIndex(zn,fd,{unique:!0});const g=l.store(ot),v=p.map(D=>g.put(D));return A.waitFor(v)})}(e,s))),o=o.next(()=>{(function(u){u.createObjectStore(Br,{keyPath:dT})})(e)})),n<5&&i>=5&&(o=o.next(()=>this.yi(s))),n<6&&i>=6&&(o=o.next(()=>(function(u){u.createObjectStore(ds)}(e),this.wi(s)))),n<7&&i>=7&&(o=o.next(()=>this.Si(s))),n<8&&i>=8&&(o=o.next(()=>this.bi(e,s))),n<9&&i>=9&&(o=o.next(()=>{(function(u){u.objectStoreNames.contains("remoteDocumentChanges")&&u.deleteObjectStore("remoteDocumentChanges")})(e)})),n<10&&i>=10&&(o=o.next(()=>this.Di(s))),n<11&&i>=11&&(o=o.next(()=>{(function(u){u.createObjectStore(sa,{keyPath:fT})})(e),function(u){u.createObjectStore(oa,{keyPath:pT})}(e)})),n<12&&i>=12&&(o=o.next(()=>{(function(u){const l=u.createObjectStore(aa,{keyPath:TT});l.createIndex(qc,wT,{unique:!1}),l.createIndex(qp,vT,{unique:!1})})(e)})),n<13&&i>=13&&(o=o.next(()=>function(u){const l=u.createObjectStore(xo,{keyPath:sT});l.createIndex(Eo,oT),l.createIndex(Lp,aT)}(e)).next(()=>this.Ci(e,s)).next(()=>e.deleteObjectStore(Ln))),n<14&&i>=14&&(o=o.next(()=>this.Fi(e,s))),n<15&&i>=15&&(o=o.next(()=>function(u){u.createObjectStore(Su,{keyPath:mT,autoIncrement:!0}).createIndex(Bc,gT,{unique:!1}),u.createObjectStore(Yi,{keyPath:_T}).createIndex(Up,yT,{unique:!1}),u.createObjectStore(Xi,{keyPath:IT}).createIndex(Bp,ET,{unique:!1})}(e))),n<16&&i>=16&&(o=o.next(()=>{t.objectStore(Yi).clear()}).next(()=>{t.objectStore(Xi).clear()})),n<17&&i>=17&&(o=o.next(()=>{(function(u){u.createObjectStore(bu,{keyPath:AT})})(e)})),n<18&&i>=18&&ip()&&(o=o.next(()=>{t.objectStore(Yi).clear()}).next(()=>{t.objectStore(Xi).clear()})),o}wi(e){let t=0;return e.store(Ln).ee((n,i)=>{t+=zo(i)}).next(()=>{const n={byteSize:t};return e.store(ds).put(Uc,n)})}yi(e){const t=e.store(hs),n=e.store(ot);return t.J().next(i=>A.forEach(i,s=>{const o=IDBKeyRange.bound([s.userId,an],[s.userId,s.lastAcknowledgedBatchId]);return n.J(zn,o).next(c=>A.forEach(c,u=>{B(u.userId===s.userId,18650,"Cannot process batch from unexpected user",{batchId:u.batchId});const l=Un(this.serializer,u);return Qm(e,s.userId,l).next(()=>{})}))}))}Si(e){const t=e.store(Ur),n=e.store(Ln);return e.store($n).get(Mo).next(i=>{const s=[];return n.ee((o,c)=>{const u=new H(o),l=function(p){return[0,Be(p)]}(u);s.push(t.get(l).next(f=>f?A.resolve():(p=>t.put({targetId:0,path:Be(p),sequenceNumber:i.highestListenSequenceNumber}))(u)))}).next(()=>A.waitFor(s))})}bi(e,t){e.createObjectStore(fs,{keyPath:hT});const n=t.store(fs),i=new zu,s=o=>{if(i.add(o)){const c=o.lastSegment(),u=o.popLast();return n.put({collectionId:c,parent:Be(u)})}};return t.store(Ln).ee({X:!0},(o,c)=>{const u=new H(o);return s(u.popLast())}).next(()=>t.store(Lr).ee({X:!0},([o,c,u],l)=>{const f=mt(c);return s(f.popLast())}))}Di(e){const t=e.store(Fr);return t.ee((n,i)=>{const s=Ki(i),o=$m(this.serializer,s);return t.put(o)})}Ci(e,t){const n=t.store(Ln),i=[];return n.ee((s,o)=>{const c=t.store(xo),u=function(p){return p.document?new x(H.fromString(p.document.name).popFirst(5)):p.noDocument?x.fromSegments(p.noDocument.path):p.unknownDocument?x.fromSegments(p.unknownDocument.path):F(36783)}(o).path.toArray(),l={prefixPath:u.slice(0,u.length-2),collectionGroup:u[u.length-2],documentId:u[u.length-1],readTime:o.readTime||[0,0],unknownDocument:o.unknownDocument,noDocument:o.noDocument,document:o.document,hasCommittedMutations:!!o.hasCommittedMutations};i.push(c.put(l))}).next(()=>A.waitFor(i))}Fi(e,t){const n=t.store(ot),i=ng(this.serializer),s=new Gu(ya.mi,this.serializer.yt);return n.J().next(o=>{const c=new Map;return o.forEach(u=>{let l=c.get(u.userId)??K();Un(this.serializer,u).keys().forEach(f=>l=l.add(f)),c.set(u.userId,l)}),A.forEach(c,(u,l)=>{const f=new Ve(l),p=ga.wt(this.serializer,f),g=s.getIndexManager(f),v=_a.wt(f,this.serializer,g,s.referenceDelegate);return new rg(i,v,p,g).recalculateAndSaveOverlaysForDocumentKeys(new zc(t,We.ce),u).next()})})}}function nf(r){r.createObjectStore(Ur,{keyPath:uT}).createIndex(Ru,lT,{unique:!0}),r.createObjectStore(Fr,{keyPath:"targetId"}).createIndex(Fp,cT,{unique:!0}),r.createObjectStore($n)}const Xt="IndexedDbPersistence",gc=18e5,_c=5e3,yc="Failed to obtain exclusive access to the persistence layer. To allow shared access, multi-tab synchronization has to be enabled in all tabs. If you are using `experimentalForceOwningTab:true`, make sure that only one tab has persistence enabled at any given time.",ig="main";class $u{constructor(e,t,n,i,s,o,c,u,l,f,p=18){if(this.allowTabSynchronization=e,this.persistenceKey=t,this.clientId=n,this.Mi=s,this.window=o,this.document=c,this.xi=l,this.Oi=f,this.Ni=p,this.ci=null,this.li=!1,this.isPrimary=!1,this.networkEnabled=!0,this.Bi=null,this.inForeground=!1,this.Li=null,this.ki=null,this.qi=Number.NEGATIVE_INFINITY,this.Qi=g=>Promise.resolve(),!$u.v())throw new C(S.UNIMPLEMENTED,"This platform is either missing IndexedDB or is known to have an incomplete implementation. Offline persistence has been disabled.");this.referenceDelegate=new bw(this,i),this.$i=t+ig,this.serializer=new Gm(u),this.Ui=new It(this.$i,this.Ni,new Uw(this.serializer)),this.hi=new gw,this.Pi=new Aw(this.referenceDelegate,this.serializer),this.remoteDocumentCache=ng(this.serializer),this.Ii=new mw,this.window&&this.window.localStorage?this.Ki=this.window.localStorage:(this.Ki=null,f===!1&&Te(Xt,"LocalStorage is unavailable. As a result, persistence may not work reliably. In particular enablePersistence() could fail immediately after refreshing the page."))}start(){return this.Wi().then(()=>{if(!this.isPrimary&&!this.allowTabSynchronization)throw new C(S.FAILED_PRECONDITION,yc);return this.Gi(),this.zi(),this.ji(),this.runTransaction("getHighestListenSequenceNumber","readonly",e=>this.Pi.getHighestSequenceNumber(e))}).then(e=>{this.ci=new We(e,this.xi)}).then(()=>{this.li=!0}).catch(e=>(this.Ui&&this.Ui.close(),Promise.reject(e)))}Ji(e){return this.Qi=async t=>{if(this.started)return e(t)},e(this.isPrimary)}setDatabaseDeletedListener(e){this.Ui.$(async t=>{t.newVersion===null&&await e()})}setNetworkEnabled(e){this.networkEnabled!==e&&(this.networkEnabled=e,this.Mi.enqueueAndForget(async()=>{this.started&&await this.Wi()}))}Wi(){return this.runTransaction("updateClientMetadataAndTryBecomePrimary","readwrite",e=>fo(e).put({clientId:this.clientId,updateTimeMs:Date.now(),networkEnabled:this.networkEnabled,inForeground:this.inForeground}).next(()=>{if(this.isPrimary)return this.Hi(e).next(t=>{t||(this.isPrimary=!1,this.Mi.enqueueRetryable(()=>this.Qi(!1)))})}).next(()=>this.Yi(e)).next(t=>this.isPrimary&&!t?this.Zi(e).next(()=>!1):!!t&&this.Xi(e).next(()=>!0))).catch(e=>{if(En(e))return N(Xt,"Failed to extend owner lease: ",e),this.isPrimary;if(!this.allowTabSynchronization)throw e;return N(Xt,"Releasing owner lease after error during lease refresh",e),!1}).then(e=>{this.isPrimary!==e&&this.Mi.enqueueRetryable(()=>this.Qi(e)),this.isPrimary=e})}Hi(e){return Ui(e).get(gr).next(t=>A.resolve(this.es(t)))}ts(e){return fo(e).delete(this.clientId)}async ns(){if(this.isPrimary&&!this.rs(this.qi,gc)){this.qi=Date.now();const e=await this.runTransaction("maybeGarbageCollectMultiClientState","readwrite-primary",t=>{const n=Ce(t,Br);return n.J().next(i=>{const s=this.ss(i,gc),o=i.filter(c=>s.indexOf(c)===-1);return A.forEach(o,c=>n.delete(c.clientId)).next(()=>o)})}).catch(()=>[]);if(this.Ki)for(const t of e)this.Ki.removeItem(this._s(t.clientId))}}ji(){this.ki=this.Mi.enqueueAfterDelay("client_metadata_refresh",4e3,()=>this.Wi().then(()=>this.ns()).then(()=>this.ji()))}es(e){return!!e&&e.ownerId===this.clientId}Yi(e){return this.Oi?A.resolve(!0):Ui(e).get(gr).next(t=>{if(t!==null&&this.rs(t.leaseTimestampMs,_c)&&!this.us(t.ownerId)){if(this.es(t)&&this.networkEnabled)return!0;if(!this.es(t)){if(!t.allowTabSynchronization)throw new C(S.FAILED_PRECONDITION,yc);return!1}}return!(!this.networkEnabled||!this.inForeground)||fo(e).J().next(n=>this.ss(n,_c).find(i=>{if(this.clientId!==i.clientId){const s=!this.networkEnabled&&i.networkEnabled,o=!this.inForeground&&i.inForeground,c=this.networkEnabled===i.networkEnabled;if(s||o&&c)return!0}return!1})===void 0)}).next(t=>(this.isPrimary!==t&&N(Xt,`Client ${t?"is":"is not"} eligible for a primary lease.`),t))}async shutdown(){this.li=!1,this.cs(),this.ki&&(this.ki.cancel(),this.ki=null),this.ls(),this.hs(),await this.Ui.runTransaction("shutdown","readwrite",[Cs,Br],e=>{const t=new zc(e,We.ce);return this.Zi(t).next(()=>this.ts(t))}),this.Ui.close(),this.Ps()}ss(e,t){return e.filter(n=>this.rs(n.updateTimeMs,t)&&!this.us(n.clientId))}Ts(){return this.runTransaction("getActiveClients","readonly",e=>fo(e).J().next(t=>this.ss(t,gc).map(n=>n.clientId)))}get started(){return this.li}getGlobalsCache(){return this.hi}getMutationQueue(e,t){return _a.wt(e,this.serializer,t,this.referenceDelegate)}getTargetCache(){return this.Pi}getRemoteDocumentCache(){return this.remoteDocumentCache}getIndexManager(e){return new vw(e,this.serializer.yt.databaseId)}getDocumentOverlayCache(e){return ga.wt(this.serializer,e)}getBundleCache(){return this.Ii}runTransaction(e,t,n){N(Xt,"Starting transaction:",e);const i=t==="readonly"?"readonly":"readwrite",s=function(u){return u===18?bT:u===17?$p:u===16?ST:u===15?Pu:u===14?Gp:u===13?jp:u===12?RT:u===11?zp:void F(60245)}(this.Ni);let o;return this.Ui.runTransaction(e,i,s,c=>(o=new zc(c,this.ci?this.ci.next():We.ce),t==="readwrite-primary"?this.Hi(o).next(u=>!!u||this.Yi(o)).next(u=>{if(!u)throw Te(`Failed to obtain primary lease for action '${e}'.`),this.isPrimary=!1,this.Mi.enqueueRetryable(()=>this.Qi(!1)),new C(S.FAILED_PRECONDITION,Vp);return n(o)}).next(u=>this.Xi(o).next(()=>u)):this.Is(o).next(()=>n(o)))).then(c=>(o.raiseOnCommittedEvent(),c))}Is(e){return Ui(e).get(gr).next(t=>{if(t!==null&&this.rs(t.leaseTimestampMs,_c)&&!this.us(t.ownerId)&&!this.es(t)&&!(this.Oi||this.allowTabSynchronization&&t.allowTabSynchronization))throw new C(S.FAILED_PRECONDITION,yc)})}Xi(e){const t={ownerId:this.clientId,allowTabSynchronization:this.allowTabSynchronization,leaseTimestampMs:Date.now()};return Ui(e).put(gr,t)}static v(){return It.v()}Zi(e){const t=Ui(e);return t.get(gr).next(n=>this.es(n)?(N(Xt,"Releasing primary lease."),t.delete(gr)):A.resolve())}rs(e,t){const n=Date.now();return!(e<n-t)&&(!(e>n)||(Te(`Detected an update time that is in the future: ${e} > ${n}`),!1))}Gi(){this.document!==null&&typeof this.document.addEventListener=="function"&&(this.Li=()=>{this.Mi.enqueueAndForget(()=>(this.inForeground=this.document.visibilityState==="visible",this.Wi()))},this.document.addEventListener("visibilitychange",this.Li),this.inForeground=this.document.visibilityState==="visible")}ls(){this.Li&&(this.document.removeEventListener("visibilitychange",this.Li),this.Li=null)}zi(){typeof this.window?.addEventListener=="function"&&(this.Bi=()=>{this.cs();const e=/(?:Version|Mobile)\/1[456]/;rp()&&(navigator.appVersion.match(e)||navigator.userAgent.match(e))&&this.Mi.enterRestrictedMode(!0),this.Mi.enqueueAndForget(()=>this.shutdown())},this.window.addEventListener("pagehide",this.Bi))}hs(){this.Bi&&(this.window.removeEventListener("pagehide",this.Bi),this.Bi=null)}us(e){try{const t=this.Ki?.getItem(this._s(e))!==null;return N(Xt,`Client '${e}' ${t?"is":"is not"} zombied in LocalStorage`),t}catch(t){return Te(Xt,"Failed to get zombied client id.",t),!1}}cs(){if(this.Ki)try{this.Ki.setItem(this._s(this.clientId),String(Date.now()))}catch(e){Te("Failed to set zombie client id.",e)}}Ps(){if(this.Ki)try{this.Ki.removeItem(this._s(this.clientId))}catch{}}_s(e){return`firestore_zombie_${this.persistenceKey}_${e}`}}function Ui(r){return Ce(r,Cs)}function fo(r){return Ce(r,Br)}function Ku(r,e){let t=r.projectId;return r.isDefaultDatabase||(t+="."+r.database),"firestore/"+e+"/"+t+"/"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wu{constructor(e,t,n,i){this.targetId=e,this.fromCache=t,this.Es=n,this.ds=i}static As(e,t){let n=K(),i=K();for(const s of t.docChanges)switch(s.type){case 0:n=n.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new Wu(e,t.fromCache,n,i)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bw{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sg{constructor(){this.Rs=!1,this.Vs=!1,this.fs=100,this.gs=function(){return rp()?8:Op(be())>0?6:4}()}initialize(e,t){this.ps=e,this.indexManager=t,this.Rs=!0}getDocumentsMatchingQuery(e,t,n,i){const s={result:null};return this.ys(e,t).next(o=>{s.result=o}).next(()=>{if(!s.result)return this.ws(e,t,i,n).next(o=>{s.result=o})}).next(()=>{if(s.result)return;const o=new Bw;return this.Ss(e,t,o).next(c=>{if(s.result=c,this.Vs)return this.bs(e,t,o,c.size)})}).next(()=>s.result)}bs(e,t,n,i){return n.documentReadCount<this.fs?(wr()<=J.DEBUG&&N("QueryEngine","SDK will not create cache indexes for query:",vr(t),"since it only creates cache indexes for collection contains","more than or equal to",this.fs,"documents"),A.resolve()):(wr()<=J.DEBUG&&N("QueryEngine","Query:",vr(t),"scans",n.documentReadCount,"local documents and returns",i,"documents as results."),n.documentReadCount>this.gs*i?(wr()<=J.DEBUG&&N("QueryEngine","The SDK decides to create cache indexes for query:",vr(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,qe(t))):A.resolve())}ys(e,t){if(Sd(t))return A.resolve(null);let n=qe(t);return this.indexManager.getIndexType(e,n).next(i=>i===0?null:(t.limit!==null&&i===1&&(t=Uo(t,null,"F"),n=qe(t)),this.indexManager.getDocumentsMatchingTarget(e,n).next(s=>{const o=K(...s);return this.ps.getDocuments(e,o).next(c=>this.indexManager.getMinOffset(e,n).next(u=>{const l=this.Ds(t,c);return this.Cs(t,l,o,u.readTime)?this.ys(e,Uo(t,null,"F")):this.vs(e,l,t,u)}))})))}ws(e,t,n,i){return Sd(t)||i.isEqual(j.min())?A.resolve(null):this.ps.getDocuments(e,n).next(s=>{const o=this.Ds(t,s);return this.Cs(t,o,n,i)?A.resolve(null):(wr()<=J.DEBUG&&N("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),vr(t)),this.vs(e,o,t,Dp(i,Or)).next(c=>c))})}Ds(e,t){let n=new se(mm(e));return t.forEach((i,s)=>{Vs(e,s)&&(n=n.add(s))}),n}Cs(e,t,n,i){if(e.limit===null)return!1;if(n.size!==t.size)return!0;const s=e.limitType==="F"?t.last():t.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}Ss(e,t,n){return wr()<=J.DEBUG&&N("QueryEngine","Using full collection scan to execute query:",vr(t)),this.ps.getDocumentsMatchingQuery(e,t,rt.min(),n)}vs(e,t,n,i){return this.ps.getDocumentsMatchingQuery(e,n,i).next(s=>(t.forEach(o=>{s=s.insert(o.key,o)}),s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hu="LocalStore",qw=3e8;class zw{constructor(e,t,n,i){this.persistence=e,this.Fs=t,this.serializer=i,this.Ms=new ce($),this.xs=new Ut(s=>Yn(s),Ds),this.Os=new Map,this.Ns=e.getRemoteDocumentCache(),this.Pi=e.getTargetCache(),this.Ii=e.getBundleCache(),this.Bs(n)}Bs(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new rg(this.Ns,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Ns.setIndexManager(this.indexManager),this.Fs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.Ms))}}function og(r,e,t,n){return new zw(r,e,t,n)}async function ag(r,e){const t=M(r);return await t.persistence.runTransaction("Handle user change","readonly",n=>{let i;return t.mutationQueue.getAllMutationBatches(n).next(s=>(i=s,t.Bs(e),t.mutationQueue.getAllMutationBatches(n))).next(s=>{const o=[],c=[];let u=K();for(const l of i){o.push(l.batchId);for(const f of l.mutations)u=u.add(f.key)}for(const l of s){c.push(l.batchId);for(const f of l.mutations)u=u.add(f.key)}return t.localDocuments.getDocuments(n,u).next(l=>({Ls:l,removedBatchIds:o,addedBatchIds:c}))})})}function jw(r,e){const t=M(r);return t.persistence.runTransaction("Acknowledge batch","readwrite-primary",n=>{const i=e.batch.keys(),s=t.Ns.newChangeBuffer({trackRemovals:!0});return function(c,u,l,f){const p=l.batch,g=p.keys();let v=A.resolve();return g.forEach(D=>{v=v.next(()=>f.getEntry(u,D)).next(k=>{const V=l.docVersions.get(D);B(V!==null,48541),k.version.compareTo(V)<0&&(p.applyToRemoteDocument(k,l),k.isValidDocument()&&(k.setReadTime(l.commitVersion),f.addEntry(k)))})}),v.next(()=>c.mutationQueue.removeMutationBatch(u,p))}(t,n,e,s).next(()=>s.apply(n)).next(()=>t.mutationQueue.performConsistencyCheck(n)).next(()=>t.documentOverlayCache.removeOverlaysForBatchId(n,i,e.batch.batchId)).next(()=>t.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(n,function(c){let u=K();for(let l=0;l<c.mutationResults.length;++l)c.mutationResults[l].transformResults.length>0&&(u=u.add(c.batch.mutations[l].key));return u}(e))).next(()=>t.localDocuments.getDocuments(n,i))})}function cg(r){const e=M(r);return e.persistence.runTransaction("Get last remote snapshot version","readonly",t=>e.Pi.getLastRemoteSnapshotVersion(t))}function Gw(r,e){const t=M(r),n=e.snapshotVersion;let i=t.Ms;return t.persistence.runTransaction("Apply remote event","readwrite-primary",s=>{const o=t.Ns.newChangeBuffer({trackRemovals:!0});i=t.Ms;const c=[];e.targetChanges.forEach((f,p)=>{const g=i.get(p);if(!g)return;c.push(t.Pi.removeMatchingKeys(s,f.removedDocuments,p).next(()=>t.Pi.addMatchingKeys(s,f.addedDocuments,p)));let v=g.withSequenceNumber(s.currentSequenceNumber);e.targetMismatches.get(p)!==null?v=v.withResumeToken(ye.EMPTY_BYTE_STRING,j.min()).withLastLimboFreeSnapshotVersion(j.min()):f.resumeToken.approximateByteSize()>0&&(v=v.withResumeToken(f.resumeToken,n)),i=i.insert(p,v),function(k,V,U){return k.resumeToken.approximateByteSize()===0||V.snapshotVersion.toMicroseconds()-k.snapshotVersion.toMicroseconds()>=qw?!0:U.addedDocuments.size+U.modifiedDocuments.size+U.removedDocuments.size>0}(g,v,f)&&c.push(t.Pi.updateTargetData(s,v))});let u=Qe(),l=K();if(e.documentUpdates.forEach(f=>{e.resolvedLimboDocuments.has(f)&&c.push(t.persistence.referenceDelegate.updateLimboDocument(s,f))}),c.push(ug(s,o,e.documentUpdates).next(f=>{u=f.ks,l=f.qs})),!n.isEqual(j.min())){const f=t.Pi.getLastRemoteSnapshotVersion(s).next(p=>t.Pi.setTargetsMetadata(s,s.currentSequenceNumber,n));c.push(f)}return A.waitFor(c).next(()=>o.apply(s)).next(()=>t.localDocuments.getLocalViewOfDocuments(s,u,l)).next(()=>u)}).then(s=>(t.Ms=i,s))}function ug(r,e,t){let n=K(),i=K();return t.forEach(s=>n=n.add(s)),e.getEntries(r,n).next(s=>{let o=Qe();return t.forEach((c,u)=>{const l=s.get(c);u.isFoundDocument()!==l.isFoundDocument()&&(i=i.add(c)),u.isNoDocument()&&u.version.isEqual(j.min())?(e.removeEntry(c,u.readTime),o=o.insert(c,u)):!l.isValidDocument()||u.version.compareTo(l.version)>0||u.version.compareTo(l.version)===0&&l.hasPendingWrites?(e.addEntry(u),o=o.insert(c,u)):N(Hu,"Ignoring outdated watch update for ",c,". Current version:",l.version," Watch version:",u.version)}),{ks:o,qs:i}})}function $w(r,e){const t=M(r);return t.persistence.runTransaction("Get next mutation batch","readonly",n=>(e===void 0&&(e=an),t.mutationQueue.getNextMutationBatchAfterBatchId(n,e)))}function Wr(r,e){const t=M(r);return t.persistence.runTransaction("Allocate target","readwrite",n=>{let i;return t.Pi.getTargetData(n,e).next(s=>s?(i=s,A.resolve(i)):t.Pi.allocateTargetId(n).next(o=>(i=new Pt(e,o,"TargetPurposeListen",n.currentSequenceNumber),t.Pi.addTargetData(n,i).next(()=>i))))}).then(n=>{const i=t.Ms.get(n.targetId);return(i===null||n.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(t.Ms=t.Ms.insert(n.targetId,n),t.xs.set(e,n.targetId)),n})}async function Hr(r,e,t){const n=M(r),i=n.Ms.get(e),s=t?"readwrite":"readwrite-primary";try{t||await n.persistence.runTransaction("Release target",s,o=>n.persistence.referenceDelegate.removeTarget(o,i))}catch(o){if(!En(o))throw o;N(Hu,`Failed to update sequence numbers for target ${e}: ${o}`)}n.Ms=n.Ms.remove(e),n.xs.delete(i.target)}function Go(r,e,t){const n=M(r);let i=j.min(),s=K();return n.persistence.runTransaction("Execute query","readwrite",o=>function(u,l,f){const p=M(u),g=p.xs.get(f);return g!==void 0?A.resolve(p.Ms.get(g)):p.Pi.getTargetData(l,f)}(n,o,qe(e)).next(c=>{if(c)return i=c.lastLimboFreeSnapshotVersion,n.Pi.getMatchingKeysForTargetId(o,c.targetId).next(u=>{s=u})}).next(()=>n.Fs.getDocumentsMatchingQuery(o,e,t?i:j.min(),t?s:K())).next(c=>(dg(n,pm(e),c),{documents:c,Qs:s})))}function lg(r,e){const t=M(r),n=M(t.Pi),i=t.Ms.get(e);return i?Promise.resolve(i.target):t.persistence.runTransaction("Get target data","readonly",s=>n.At(s,e).next(o=>o?o.target:null))}function hg(r,e){const t=M(r),n=t.Os.get(e)||j.min();return t.persistence.runTransaction("Get new document changes","readonly",i=>t.Ns.getAllFromCollectionGroup(i,e,Dp(n,Or),Number.MAX_SAFE_INTEGER)).then(i=>(dg(t,e,i),i))}function dg(r,e,t){let n=r.Os.get(e)||j.min();t.forEach((i,s)=>{s.readTime.compareTo(n)>0&&(n=s.readTime)}),r.Os.set(e,n)}async function Kw(r,e,t,n){const i=M(r);let s=K(),o=Qe();for(const l of t){const f=e.$s(l.metadata.name);l.document&&(s=s.add(f));const p=e.Us(l);p.setReadTime(e.Ks(l.metadata.readTime)),o=o.insert(f,p)}const c=i.Ns.newChangeBuffer({trackRemovals:!0}),u=await Wr(i,function(f){return qe(ii(H.fromString(`__bundle__/docs/${f}`)))}(n));return i.persistence.runTransaction("Apply bundle documents","readwrite",l=>ug(l,c,o).next(f=>(c.apply(l),f)).next(f=>i.Pi.removeMatchingKeysForTargetId(l,u.targetId).next(()=>i.Pi.addMatchingKeys(l,s,u.targetId)).next(()=>i.localDocuments.getLocalViewOfDocuments(l,f.ks,f.qs)).next(()=>f.ks)))}async function Ww(r,e,t=K()){const n=await Wr(r,qe(ma(e.bundledQuery))),i=M(r);return i.persistence.runTransaction("Save named query","readwrite",s=>{const o=we(e.readTime);if(n.snapshotVersion.compareTo(o)>=0)return i.Ii.saveNamedQuery(s,e);const c=n.withResumeToken(ye.EMPTY_BYTE_STRING,o);return i.Ms=i.Ms.insert(c.targetId,c),i.Pi.updateTargetData(s,c).next(()=>i.Pi.removeMatchingKeysForTargetId(s,n.targetId)).next(()=>i.Pi.addMatchingKeys(s,t,n.targetId)).next(()=>i.Ii.saveNamedQuery(s,e))})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fg="firestore_clients";function rf(r,e){return`${fg}_${r}_${e}`}const pg="firestore_mutations";function sf(r,e,t){let n=`${pg}_${r}_${t}`;return e.isAuthenticated()&&(n+=`_${e.uid}`),n}const mg="firestore_targets";function Ic(r,e){return`${mg}_${r}_${e}`}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pt="SharedClientState";class $o{constructor(e,t,n,i){this.user=e,this.batchId=t,this.state=n,this.error=i}static Ws(e,t,n){const i=JSON.parse(n);let s,o=typeof i=="object"&&["pending","acknowledged","rejected"].indexOf(i.state)!==-1&&(i.error===void 0||typeof i.error=="object");return o&&i.error&&(o=typeof i.error.message=="string"&&typeof i.error.code=="string",o&&(s=new C(i.error.code,i.error.message))),o?new $o(e,t,i.state,s):(Te(pt,`Failed to parse mutation state for ID '${t}': ${n}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class ns{constructor(e,t,n){this.targetId=e,this.state=t,this.error=n}static Ws(e,t){const n=JSON.parse(t);let i,s=typeof n=="object"&&["not-current","current","rejected"].indexOf(n.state)!==-1&&(n.error===void 0||typeof n.error=="object");return s&&n.error&&(s=typeof n.error.message=="string"&&typeof n.error.code=="string",s&&(i=new C(n.error.code,n.error.message))),s?new ns(e,n.state,i):(Te(pt,`Failed to parse target state for ID '${e}': ${t}`),null)}Gs(){const e={state:this.state,updateTimeMs:Date.now()};return this.error&&(e.error={code:this.error.code,message:this.error.message}),JSON.stringify(e)}}class Ko{constructor(e,t){this.clientId=e,this.activeTargetIds=t}static Ws(e,t){const n=JSON.parse(t);let i=typeof n=="object"&&n.activeTargetIds instanceof Array,s=Nu();for(let o=0;i&&o<n.activeTargetIds.length;++o)i=xp(n.activeTargetIds[o]),s=s.add(n.activeTargetIds[o]);return i?new Ko(e,s):(Te(pt,`Failed to parse client data for instance '${e}': ${t}`),null)}}class Qu{constructor(e,t){this.clientId=e,this.onlineState=t}static Ws(e){const t=JSON.parse(e);return typeof t=="object"&&["Unknown","Online","Offline"].indexOf(t.onlineState)!==-1&&typeof t.clientId=="string"?new Qu(t.clientId,t.onlineState):(Te(pt,`Failed to parse online state: ${e}`),null)}}class ru{constructor(){this.activeTargetIds=Nu()}zs(e){this.activeTargetIds=this.activeTargetIds.add(e)}js(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Gs(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class Ec{constructor(e,t,n,i,s){this.window=e,this.Mi=t,this.persistenceKey=n,this.Js=i,this.syncEngine=null,this.onlineStateHandler=null,this.sequenceNumberHandler=null,this.Hs=this.Ys.bind(this),this.Zs=new ce($),this.started=!1,this.Xs=[];const o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");this.storage=this.window.localStorage,this.currentUser=s,this.eo=rf(this.persistenceKey,this.Js),this.no=function(u){return`firestore_sequence_number_${u}`}(this.persistenceKey),this.Zs=this.Zs.insert(this.Js,new ru),this.ro=new RegExp(`^${fg}_${o}_([^_]*)$`),this.io=new RegExp(`^${pg}_${o}_(\\d+)(?:_(.*))?$`),this.so=new RegExp(`^${mg}_${o}_(\\d+)$`),this.oo=function(u){return`firestore_online_state_${u}`}(this.persistenceKey),this._o=function(u){return`firestore_bundle_loaded_v2_${u}`}(this.persistenceKey),this.window.addEventListener("storage",this.Hs)}static v(e){return!(!e||!e.localStorage)}async start(){const e=await this.syncEngine.Ts();for(const n of e){if(n===this.Js)continue;const i=this.getItem(rf(this.persistenceKey,n));if(i){const s=Ko.Ws(n,i);s&&(this.Zs=this.Zs.insert(s.clientId,s))}}this.ao();const t=this.storage.getItem(this.oo);if(t){const n=this.uo(t);n&&this.co(n)}for(const n of this.Xs)this.Ys(n);this.Xs=[],this.window.addEventListener("pagehide",()=>this.shutdown()),this.started=!0}writeSequenceNumber(e){this.setItem(this.no,JSON.stringify(e))}getAllActiveQueryTargets(){return this.lo(this.Zs)}isActiveQueryTarget(e){let t=!1;return this.Zs.forEach((n,i)=>{i.activeTargetIds.has(e)&&(t=!0)}),t}addPendingMutation(e){this.ho(e,"pending")}updateMutationState(e,t,n){this.ho(e,t,n),this.Po(e)}addLocalQueryTarget(e,t=!0){let n="not-current";if(this.isActiveQueryTarget(e)){const i=this.storage.getItem(Ic(this.persistenceKey,e));if(i){const s=ns.Ws(e,i);s&&(n=s.state)}}return t&&this.To.zs(e),this.ao(),n}removeLocalQueryTarget(e){this.To.js(e),this.ao()}isLocalQueryTarget(e){return this.To.activeTargetIds.has(e)}clearQueryState(e){this.removeItem(Ic(this.persistenceKey,e))}updateQueryState(e,t,n){this.Io(e,t,n)}handleUserChange(e,t,n){t.forEach(i=>{this.Po(i)}),this.currentUser=e,n.forEach(i=>{this.addPendingMutation(i)})}setOnlineState(e){this.Eo(e)}notifyBundleLoaded(e){this.Ao(e)}shutdown(){this.started&&(this.window.removeEventListener("storage",this.Hs),this.removeItem(this.eo),this.started=!1)}getItem(e){const t=this.storage.getItem(e);return N(pt,"READ",e,t),t}setItem(e,t){N(pt,"SET",e,t),this.storage.setItem(e,t)}removeItem(e){N(pt,"REMOVE",e),this.storage.removeItem(e)}Ys(e){const t=e;if(t.storageArea===this.storage){if(N(pt,"EVENT",t.key,t.newValue),t.key===this.eo)return void Te("Received WebStorage notification for local change. Another client might have garbage-collected our state");this.Mi.enqueueRetryable(async()=>{if(this.started){if(t.key!==null){if(this.ro.test(t.key)){if(t.newValue==null){const n=this.Ro(t.key);return this.Vo(n,null)}{const n=this.mo(t.key,t.newValue);if(n)return this.Vo(n.clientId,n)}}else if(this.io.test(t.key)){if(t.newValue!==null){const n=this.fo(t.key,t.newValue);if(n)return this.po(n)}}else if(this.so.test(t.key)){if(t.newValue!==null){const n=this.yo(t.key,t.newValue);if(n)return this.wo(n)}}else if(t.key===this.oo){if(t.newValue!==null){const n=this.uo(t.newValue);if(n)return this.co(n)}}else if(t.key===this.no){const n=function(s){let o=We.ce;if(s!=null)try{const c=JSON.parse(s);B(typeof c=="number",30636,{So:s}),o=c}catch(c){Te(pt,"Failed to read sequence number from WebStorage",c)}return o}(t.newValue);n!==We.ce&&this.sequenceNumberHandler(n)}else if(t.key===this._o){const n=this.bo(t.newValue);await Promise.all(n.map(i=>this.syncEngine.Do(i)))}}}else this.Xs.push(t)})}}get To(){return this.Zs.get(this.Js)}ao(){this.setItem(this.eo,this.To.Gs())}ho(e,t,n){const i=new $o(this.currentUser,e,t,n),s=sf(this.persistenceKey,this.currentUser,e);this.setItem(s,i.Gs())}Po(e){const t=sf(this.persistenceKey,this.currentUser,e);this.removeItem(t)}Eo(e){const t={clientId:this.Js,onlineState:e};this.storage.setItem(this.oo,JSON.stringify(t))}Io(e,t,n){const i=Ic(this.persistenceKey,e),s=new ns(e,t,n);this.setItem(i,s.Gs())}Ao(e){const t=JSON.stringify(Array.from(e));this.setItem(this._o,t)}Ro(e){const t=this.ro.exec(e);return t?t[1]:null}mo(e,t){const n=this.Ro(e);return Ko.Ws(n,t)}fo(e,t){const n=this.io.exec(e),i=Number(n[1]),s=n[2]!==void 0?n[2]:null;return $o.Ws(new Ve(s),i,t)}yo(e,t){const n=this.so.exec(e),i=Number(n[1]);return ns.Ws(i,t)}uo(e){return Qu.Ws(e)}bo(e){return JSON.parse(e)}async po(e){if(e.user.uid===this.currentUser.uid)return this.syncEngine.Co(e.batchId,e.state,e.error);N(pt,`Ignoring mutation for non-active user ${e.user.uid}`)}wo(e){return this.syncEngine.vo(e.targetId,e.state,e.error)}Vo(e,t){const n=t?this.Zs.insert(e,t):this.Zs.remove(e),i=this.lo(this.Zs),s=this.lo(n),o=[],c=[];return s.forEach(u=>{i.has(u)||o.push(u)}),i.forEach(u=>{s.has(u)||c.push(u)}),this.syncEngine.Fo(o,c).then(()=>{this.Zs=n})}co(e){this.Zs.get(e.clientId)&&this.onlineStateHandler(e.onlineState)}lo(e){let t=Nu();return e.forEach((n,i)=>{t=t.unionWith(i.activeTargetIds)}),t}}class gg{constructor(){this.Mo=new ru,this.xo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,n){}addLocalQueryTarget(e,t=!0){return t&&this.Mo.zs(e),this.xo[e]||"not-current"}updateQueryState(e,t,n){this.xo[e]=t}removeLocalQueryTarget(e){this.Mo.js(e)}isLocalQueryTarget(e){return this.Mo.activeTargetIds.has(e)}clearQueryState(e){delete this.xo[e]}getAllActiveQueryTargets(){return this.Mo.activeTargetIds}isActiveQueryTarget(e){return this.Mo.activeTargetIds.has(e)}start(){return this.Mo=new ru,Promise.resolve()}handleUserChange(e,t,n){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hw{Oo(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const of="ConnectivityMonitor";class af{constructor(){this.No=()=>this.Bo(),this.Lo=()=>this.ko(),this.qo=[],this.Qo()}Oo(e){this.qo.push(e)}shutdown(){window.removeEventListener("online",this.No),window.removeEventListener("offline",this.Lo)}Qo(){window.addEventListener("online",this.No),window.addEventListener("offline",this.Lo)}Bo(){N(of,"Network connectivity changed: AVAILABLE");for(const e of this.qo)e(0)}ko(){N(of,"Network connectivity changed: UNAVAILABLE");for(const e of this.qo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let po=null;function iu(){return po===null?po=function(){return 268435456+Math.round(2147483648*Math.random())}():po++,"0x"+po.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tc="RestConnection",Qw={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class Jw{get $o(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const t=e.ssl?"https":"http",n=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Uo=t+"://"+e.host,this.Ko=`projects/${n}/databases/${i}`,this.Wo=this.databaseId.database===ms?`project_id=${n}`:`project_id=${n}&database_id=${i}`}Go(e,t,n,i,s){const o=iu(),c=this.zo(e,t.toUriEncodedString());N(Tc,`Sending RPC '${e}' ${o}:`,c,n);const u={"google-cloud-resource-prefix":this.Ko,"x-goog-request-params":this.Wo};this.jo(u,i,s);const{host:l}=new URL(c),f=sr(l);return this.Jo(e,c,u,n,f).then(p=>(N(Tc,`Received RPC '${e}' ${o}: `,p),p),p=>{throw nt(Tc,`RPC '${e}' ${o} failed with error: `,p,"url: ",c,"request:",n),p})}Ho(e,t,n,i,s,o){return this.Go(e,t,n,i,s)}jo(e,t,n){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+ri}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((i,s)=>e[s]=i),n&&n.headers.forEach((i,s)=>e[s]=i)}zo(e,t){const n=Qw[e];return`${this.Uo}/v1/${t}:${n}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yw{constructor(e){this.Yo=e.Yo,this.Zo=e.Zo}Xo(e){this.e_=e}t_(e){this.n_=e}r_(e){this.i_=e}onMessage(e){this.s_=e}close(){this.Zo()}send(e){this.Yo(e)}o_(){this.e_()}__(){this.n_()}a_(e){this.i_(e)}u_(e){this.s_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fe="WebChannelConnection";class Xw extends Jw{constructor(e){super(e),this.c_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,n,i,s){const o=iu();return new Promise((c,u)=>{const l=new yp;l.setWithCredentials(!0),l.listenOnce(Ip.COMPLETE,()=>{try{switch(l.getLastErrorCode()){case yo.NO_ERROR:const p=l.getResponseJson();N(Fe,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(p)),c(p);break;case yo.TIMEOUT:N(Fe,`RPC '${e}' ${o} timed out`),u(new C(S.DEADLINE_EXCEEDED,"Request time out"));break;case yo.HTTP_ERROR:const g=l.getStatus();if(N(Fe,`RPC '${e}' ${o} failed with status:`,g,"response text:",l.getResponseText()),g>0){let v=l.getResponseJson();Array.isArray(v)&&(v=v[0]);const D=v?.error;if(D&&D.status&&D.message){const k=function(U){const G=U.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(G)>=0?G:S.UNKNOWN}(D.status);u(new C(k,D.message))}else u(new C(S.UNKNOWN,"Server responded with status "+l.getStatus()))}else u(new C(S.UNAVAILABLE,"Connection failed."));break;default:F(9055,{l_:e,streamId:o,h_:l.getLastErrorCode(),P_:l.getLastError()})}}finally{N(Fe,`RPC '${e}' ${o} completed.`)}});const f=JSON.stringify(i);N(Fe,`RPC '${e}' ${o} sending request:`,i),l.send(t,"POST",f,n,15)})}T_(e,t,n){const i=iu(),s=[this.Uo,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=wp(),c=Tp(),u={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},l=this.longPollingOptions.timeoutSeconds;l!==void 0&&(u.longPollingTimeout=Math.round(1e3*l)),this.useFetchStreams&&(u.useFetchStreams=!0),this.jo(u.initMessageHeaders,t,n),u.encodeInitMessageHeaders=!0;const f=s.join("");N(Fe,`Creating RPC '${e}' stream ${i}: ${f}`,u);const p=o.createWebChannel(f,u);this.I_(p);let g=!1,v=!1;const D=new Yw({Yo:V=>{v?N(Fe,`Not sending because RPC '${e}' stream ${i} is closed:`,V):(g||(N(Fe,`Opening RPC '${e}' stream ${i} transport.`),p.open(),g=!0),N(Fe,`RPC '${e}' stream ${i} sending:`,V),p.send(V))},Zo:()=>p.close()}),k=(V,U,G)=>{V.listen(U,q=>{try{G(q)}catch(ee){setTimeout(()=>{throw ee},0)}})};return k(p,ji.EventType.OPEN,()=>{v||(N(Fe,`RPC '${e}' stream ${i} transport opened.`),D.o_())}),k(p,ji.EventType.CLOSE,()=>{v||(v=!0,N(Fe,`RPC '${e}' stream ${i} transport closed`),D.a_(),this.E_(p))}),k(p,ji.EventType.ERROR,V=>{v||(v=!0,nt(Fe,`RPC '${e}' stream ${i} transport errored. Name:`,V.name,"Message:",V.message),D.a_(new C(S.UNAVAILABLE,"The operation could not be completed")))}),k(p,ji.EventType.MESSAGE,V=>{if(!v){const U=V.data[0];B(!!U,16349);const G=U,q=G?.error||G[0]?.error;if(q){N(Fe,`RPC '${e}' stream ${i} received error:`,q);const ee=q.status;let te=function(_){const I=ve[_];if(I!==void 0)return Cm(I)}(ee),X=q.message;te===void 0&&(te=S.INTERNAL,X="Unknown error status: "+ee+" with message "+q.message),v=!0,D.a_(new C(te,X)),p.close()}else N(Fe,`RPC '${e}' stream ${i} received:`,U),D.u_(U)}}),k(c,Ep.STAT_EVENT,V=>{V.stat===Oc.PROXY?N(Fe,`RPC '${e}' stream ${i} detected buffering proxy`):V.stat===Oc.NOPROXY&&N(Fe,`RPC '${e}' stream ${i} detected no buffering proxy`)}),setTimeout(()=>{D.__()},0),D}terminate(){this.c_.forEach(e=>e.close()),this.c_=[]}I_(e){this.c_.push(e)}E_(e){this.c_=this.c_.filter(t=>t===e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _g(){return typeof window<"u"?window:null}function bo(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function cr(r){return new iw(r,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ju{constructor(e,t,n=1e3,i=1.5,s=6e4){this.Mi=e,this.timerId=t,this.d_=n,this.A_=i,this.R_=s,this.V_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.V_=0}g_(){this.V_=this.R_}p_(e){this.cancel();const t=Math.floor(this.V_+this.y_()),n=Math.max(0,Date.now()-this.f_),i=Math.max(0,t-n);i>0&&N("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.V_} ms, delay with jitter: ${t} ms, last attempt: ${n} ms ago)`),this.m_=this.Mi.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),e())),this.V_*=this.A_,this.V_<this.d_&&(this.V_=this.d_),this.V_>this.R_&&(this.V_=this.R_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.V_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cf="PersistentStream";class yg{constructor(e,t,n,i,s,o,c,u){this.Mi=e,this.S_=n,this.b_=i,this.connection=s,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=c,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new Ju(e,t)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Mi.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.Q_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}Q_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,t){this.Q_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():t&&t.code===S.RESOURCE_EXHAUSTED?(Te(t.toString()),Te("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):t&&t.code===S.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.K_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.r_(t)}K_(){}auth(){this.state=1;const e=this.W_(this.D_),t=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([n,i])=>{this.D_===t&&this.G_(n,i)},n=>{e(()=>{const i=new C(S.UNKNOWN,"Fetching auth token failed: "+n.message);return this.z_(i)})})}G_(e,t){const n=this.W_(this.D_);this.stream=this.j_(e,t),this.stream.Xo(()=>{n(()=>this.listener.Xo())}),this.stream.t_(()=>{n(()=>(this.state=2,this.v_=this.Mi.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.t_()))}),this.stream.r_(i=>{n(()=>this.z_(i))}),this.stream.onMessage(i=>{n(()=>++this.F_==1?this.J_(i):this.onNext(i))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return N(cf,`close with error: ${e}`),this.stream=null,this.close(4,e)}W_(e){return t=>{this.Mi.enqueueAndForget(()=>this.D_===e?t():(N(cf,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class Zw extends yg{constructor(e,t,n,i,s,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",t,n,i,o),this.serializer=s}j_(e,t){return this.connection.T_("Listen",e,t)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const t=aw(this.serializer,e),n=function(s){if(!("targetChange"in s))return j.min();const o=s.targetChange;return o.targetIds&&o.targetIds.length?j.min():o.readTime?we(o.readTime):j.min()}(e);return this.listener.H_(t,n)}Y_(e){const t={};t.database=Xc(this.serializer),t.addTarget=function(s,o){let c;const u=o.target;if(c=Lo(u)?{documents:Fm(s,u)}:{query:pa(s,u).ft},c.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){c.resumeToken=Nm(s,o.resumeToken);const l=Jc(s,o.expectedCount);l!==null&&(c.expectedCount=l)}else if(o.snapshotVersion.compareTo(j.min())>0){c.readTime=Kr(s,o.snapshotVersion.toTimestamp());const l=Jc(s,o.expectedCount);l!==null&&(c.expectedCount=l)}return c}(this.serializer,e);const n=uw(this.serializer,e);n&&(t.labels=n),this.q_(t)}Z_(e){const t={};t.database=Xc(this.serializer),t.removeTarget=e,this.q_(t)}}class ev extends yg{constructor(e,t,n,i,s,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",t,n,i,o),this.serializer=s}get X_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}K_(){this.X_&&this.ea([])}j_(e,t){return this.connection.T_("Write",e,t)}J_(e){return B(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,B(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){B(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const t=cw(e.writeResults,e.commitTime),n=we(e.commitTime);return this.listener.na(n,t)}ra(){const e={};e.database=Xc(this.serializer),this.q_(e)}ea(e){const t={streamToken:this.lastStreamToken,writes:e.map(n=>Es(this.serializer,n))};this.q_(t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tv{}class nv extends tv{constructor(e,t,n,i){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=n,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new C(S.FAILED_PRECONDITION,"The client has already been terminated.")}Go(e,t,n,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,o])=>this.connection.Go(e,Yc(t,n),i,s,o)).catch(s=>{throw s.name==="FirebaseError"?(s.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),s):new C(S.UNKNOWN,s.toString())})}Ho(e,t,n,i,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,c])=>this.connection.Ho(e,Yc(t,n),i,o,c,s)).catch(o=>{throw o.name==="FirebaseError"?(o.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new C(S.UNKNOWN,o.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}class rv{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(Te(t),this.aa=!1):N("OnlineStateTracker",t)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const rr="RemoteStore";class iv{constructor(e,t,n,i,s){this.localStore=e,this.datastore=t,this.asyncQueue=n,this.remoteSyncer={},this.Ta=[],this.Ia=new Map,this.Ea=new Set,this.da=[],this.Aa=s,this.Aa.Oo(o=>{n.enqueueAndForget(async()=>{wn(this)&&(N(rr,"Restarting streams for network reachability change."),await async function(u){const l=M(u);l.Ea.add(4),await ai(l),l.Ra.set("Unknown"),l.Ea.delete(4),await Ms(l)}(this))})}),this.Ra=new rv(n,i)}}async function Ms(r){if(wn(r))for(const e of r.da)await e(!0)}async function ai(r){for(const e of r.da)await e(!1)}function Ia(r,e){const t=M(r);t.Ia.has(e.targetId)||(t.Ia.set(e.targetId,e),Zu(t)?Xu(t):ui(t).O_()&&Yu(t,e))}function Qr(r,e){const t=M(r),n=ui(t);t.Ia.delete(e),n.O_()&&Ig(t,e),t.Ia.size===0&&(n.O_()?n.L_():wn(t)&&t.Ra.set("Unknown"))}function Yu(r,e){if(r.Va.Ue(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(j.min())>0){const t=r.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(t)}ui(r).Y_(e)}function Ig(r,e){r.Va.Ue(e),ui(r).Z_(e)}function Xu(r){r.Va=new ew({getRemoteKeysForTarget:e=>r.remoteSyncer.getRemoteKeysForTarget(e),At:e=>r.Ia.get(e)||null,ht:()=>r.datastore.serializer.databaseId}),ui(r).start(),r.Ra.ua()}function Zu(r){return wn(r)&&!ui(r).x_()&&r.Ia.size>0}function wn(r){return M(r).Ea.size===0}function Eg(r){r.Va=void 0}async function sv(r){r.Ra.set("Online")}async function ov(r){r.Ia.forEach((e,t)=>{Yu(r,e)})}async function av(r,e){Eg(r),Zu(r)?(r.Ra.ha(e),Xu(r)):r.Ra.set("Unknown")}async function cv(r,e,t){if(r.Ra.set("Online"),e instanceof Vm&&e.state===2&&e.cause)try{await async function(i,s){const o=s.cause;for(const c of s.targetIds)i.Ia.has(c)&&(await i.remoteSyncer.rejectListen(c,o),i.Ia.delete(c),i.Va.removeTarget(c))}(r,e)}catch(n){N(rr,"Failed to remove targets %s: %s ",e.targetIds.join(","),n),await Wo(r,n)}else if(e instanceof Ro?r.Va.Ze(e):e instanceof km?r.Va.st(e):r.Va.tt(e),!t.isEqual(j.min()))try{const n=await cg(r.localStore);t.compareTo(n)>=0&&await function(s,o){const c=s.Va.Tt(o);return c.targetChanges.forEach((u,l)=>{if(u.resumeToken.approximateByteSize()>0){const f=s.Ia.get(l);f&&s.Ia.set(l,f.withResumeToken(u.resumeToken,o))}}),c.targetMismatches.forEach((u,l)=>{const f=s.Ia.get(u);if(!f)return;s.Ia.set(u,f.withResumeToken(ye.EMPTY_BYTE_STRING,f.snapshotVersion)),Ig(s,u);const p=new Pt(f.target,u,l,f.sequenceNumber);Yu(s,p)}),s.remoteSyncer.applyRemoteEvent(c)}(r,t)}catch(n){N(rr,"Failed to raise snapshot:",n),await Wo(r,n)}}async function Wo(r,e,t){if(!En(e))throw e;r.Ea.add(1),await ai(r),r.Ra.set("Offline"),t||(t=()=>cg(r.localStore)),r.asyncQueue.enqueueRetryable(async()=>{N(rr,"Retrying IndexedDB access"),await t(),r.Ea.delete(1),await Ms(r)})}function Tg(r,e){return e().catch(t=>Wo(r,t,e))}async function ci(r){const e=M(r),t=gn(e);let n=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:an;for(;uv(e);)try{const i=await $w(e.localStore,n);if(i===null){e.Ta.length===0&&t.L_();break}n=i.batchId,lv(e,i)}catch(i){await Wo(e,i)}wg(e)&&vg(e)}function uv(r){return wn(r)&&r.Ta.length<10}function lv(r,e){r.Ta.push(e);const t=gn(r);t.O_()&&t.X_&&t.ea(e.mutations)}function wg(r){return wn(r)&&!gn(r).x_()&&r.Ta.length>0}function vg(r){gn(r).start()}async function hv(r){gn(r).ra()}async function dv(r){const e=gn(r);for(const t of r.Ta)e.ea(t.mutations)}async function fv(r,e,t){const n=r.Ta.shift(),i=Lu.from(n,e,t);await Tg(r,()=>r.remoteSyncer.applySuccessfulWrite(i)),await ci(r)}async function pv(r,e){e&&gn(r).X_&&await async function(n,i){if(function(o){return Pm(o)&&o!==S.ABORTED}(i.code)){const s=n.Ta.shift();gn(n).B_(),await Tg(n,()=>n.remoteSyncer.rejectFailedWrite(s.batchId,i)),await ci(n)}}(r,e),wg(r)&&vg(r)}async function uf(r,e){const t=M(r);t.asyncQueue.verifyOperationInProgress(),N(rr,"RemoteStore received new credentials");const n=wn(t);t.Ea.add(3),await ai(t),n&&t.Ra.set("Unknown"),await t.remoteSyncer.handleCredentialChange(e),t.Ea.delete(3),await Ms(t)}async function su(r,e){const t=M(r);e?(t.Ea.delete(2),await Ms(t)):e||(t.Ea.add(2),await ai(t),t.Ra.set("Unknown"))}function ui(r){return r.ma||(r.ma=function(t,n,i){const s=M(t);return s.sa(),new Zw(n,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(r.datastore,r.asyncQueue,{Xo:sv.bind(null,r),t_:ov.bind(null,r),r_:av.bind(null,r),H_:cv.bind(null,r)}),r.da.push(async e=>{e?(r.ma.B_(),Zu(r)?Xu(r):r.Ra.set("Unknown")):(await r.ma.stop(),Eg(r))})),r.ma}function gn(r){return r.fa||(r.fa=function(t,n,i){const s=M(t);return s.sa(),new ev(n,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(r.datastore,r.asyncQueue,{Xo:()=>Promise.resolve(),t_:hv.bind(null,r),r_:pv.bind(null,r),ta:dv.bind(null,r),na:fv.bind(null,r)}),r.da.push(async e=>{e?(r.fa.B_(),await ci(r)):(await r.fa.stop(),r.Ta.length>0&&(N(rr,`Stopping write stream with ${r.Ta.length} pending writes`),r.Ta=[]))})),r.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class el{constructor(e,t,n,i,s){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=n,this.op=i,this.removalCallback=s,this.deferred=new Ne,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,n,i,s){const o=Date.now()+n,c=new el(e,t,o,i,s);return c.start(n),c}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new C(S.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function li(r,e){if(Te("AsyncQueue",`${e}: ${r}`),En(r))return new C(S.UNAVAILABLE,`${e}: ${r}`);throw r}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kn{static emptySet(e){return new Kn(e.comparator)}constructor(e){this.comparator=e?(t,n)=>e(t,n)||x.comparator(t.key,n.key):(t,n)=>x.comparator(t.key,n.key),this.keyedMap=Gi(),this.sortedSet=new ce(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const t=this.keyedMap.get(e);return t?this.sortedSet.indexOf(t):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((t,n)=>(e(t),!1))}add(e){const t=this.delete(e.key);return t.copy(t.keyedMap.insert(e.key,e),t.sortedSet.insert(e,null))}delete(e){const t=this.get(e);return t?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(t)):this}isEqual(e){if(!(e instanceof Kn)||this.size!==e.size)return!1;const t=this.sortedSet.getIterator(),n=e.sortedSet.getIterator();for(;t.hasNext();){const i=t.getNext().key,s=n.getNext().key;if(!i.isEqual(s))return!1}return!0}toString(){const e=[];return this.forEach(t=>{e.push(t.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,t){const n=new Kn;return n.comparator=this.comparator,n.keyedMap=e,n.sortedSet=t,n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lf{constructor(){this.ga=new ce(x.comparator)}track(e){const t=e.doc.key,n=this.ga.get(t);n?e.type!==0&&n.type===3?this.ga=this.ga.insert(t,e):e.type===3&&n.type!==1?this.ga=this.ga.insert(t,{type:n.type,doc:e.doc}):e.type===2&&n.type===2?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):e.type===2&&n.type===0?this.ga=this.ga.insert(t,{type:0,doc:e.doc}):e.type===1&&n.type===0?this.ga=this.ga.remove(t):e.type===1&&n.type===2?this.ga=this.ga.insert(t,{type:1,doc:n.doc}):e.type===0&&n.type===1?this.ga=this.ga.insert(t,{type:2,doc:e.doc}):F(63341,{Rt:e,pa:n}):this.ga=this.ga.insert(t,e)}ya(){const e=[];return this.ga.inorderTraversal((t,n)=>{e.push(n)}),e}}class ir{constructor(e,t,n,i,s,o,c,u,l){this.query=e,this.docs=t,this.oldDocs=n,this.docChanges=i,this.mutatedKeys=s,this.fromCache=o,this.syncStateChanged=c,this.excludesMetadataChanges=u,this.hasCachedResults=l}static fromInitialDocuments(e,t,n,i,s){const o=[];return t.forEach(c=>{o.push({type:0,doc:c})}),new ir(e,t,Kn.emptySet(t),o,n,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&ks(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const t=this.docChanges,n=e.docChanges;if(t.length!==n.length)return!1;for(let i=0;i<t.length;i++)if(t[i].type!==n[i].type||!t[i].doc.isEqual(n[i].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mv{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class gv{constructor(){this.queries=hf(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(t,n){const i=M(t),s=i.queries;i.queries=hf(),s.forEach((o,c)=>{for(const u of c.Sa)u.onError(n)})})(this,new C(S.ABORTED,"Firestore shutting down"))}}function hf(){return new Ut(r=>fm(r),ks)}async function tl(r,e){const t=M(r);let n=3;const i=e.query;let s=t.queries.get(i);s?!s.ba()&&e.Da()&&(n=2):(s=new mv,n=e.Da()?0:1);try{switch(n){case 0:s.wa=await t.onListen(i,!0);break;case 1:s.wa=await t.onListen(i,!1);break;case 2:await t.onFirstRemoteStoreListen(i)}}catch(o){const c=li(o,`Initialization of query '${vr(e.query)}' failed`);return void e.onError(c)}t.queries.set(i,s),s.Sa.push(e),e.va(t.onlineState),s.wa&&e.Fa(s.wa)&&rl(t)}async function nl(r,e){const t=M(r),n=e.query;let i=3;const s=t.queries.get(n);if(s){const o=s.Sa.indexOf(e);o>=0&&(s.Sa.splice(o,1),s.Sa.length===0?i=e.Da()?0:1:!s.ba()&&e.Da()&&(i=2))}switch(i){case 0:return t.queries.delete(n),t.onUnlisten(n,!0);case 1:return t.queries.delete(n),t.onUnlisten(n,!1);case 2:return t.onLastRemoteStoreUnlisten(n);default:return}}function _v(r,e){const t=M(r);let n=!1;for(const i of e){const s=i.query,o=t.queries.get(s);if(o){for(const c of o.Sa)c.Fa(i)&&(n=!0);o.wa=i}}n&&rl(t)}function yv(r,e,t){const n=M(r),i=n.queries.get(e);if(i)for(const s of i.Sa)s.onError(t);n.queries.delete(e)}function rl(r){r.Ca.forEach(e=>{e.next()})}var ou,df;(df=ou||(ou={})).Ma="default",df.Cache="cache";class il{constructor(e,t,n){this.query=e,this.xa=t,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=n||{}}Fa(e){if(!this.options.includeMetadataChanges){const n=[];for(const i of e.docChanges)i.type!==3&&n.push(i);e=new ir(e.query,e.docs,e.oldDocs,n,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let t=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),t=!0):this.La(e,this.onlineState)&&(this.ka(e),t=!0),this.Na=e,t}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let t=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),t=!0),t}La(e,t){if(!e.fromCache||!this.Da())return!0;const n=t!=="Offline";return(!this.options.qa||!n)&&(!e.docs.isEmpty()||e.hasCachedResults||t==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const t=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!t)&&this.options.includeMetadataChanges===!0}ka(e){e=ir.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==ou.Cache}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ag{constructor(e,t){this.Qa=e,this.byteLength=t}$a(){return"metadata"in this.Qa}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ff{constructor(e){this.serializer=e}$s(e){return Et(this.serializer,e)}Us(e){return e.metadata.exists?fa(this.serializer,e.document,!1):le.newNoDocument(this.$s(e.metadata.name),this.Ks(e.metadata.readTime))}Ks(e){return we(e)}}class sl{constructor(e,t){this.Ua=e,this.serializer=t,this.Ka=[],this.Wa=[],this.collectionGroups=new Set,this.progress=Rg(e)}get queries(){return this.Ka}get documents(){return this.Wa}Ga(e){this.progress.bytesLoaded+=e.byteLength;let t=this.progress.documentsLoaded;if(e.Qa.namedQuery)this.Ka.push(e.Qa.namedQuery);else if(e.Qa.documentMetadata){this.Wa.push({metadata:e.Qa.documentMetadata}),e.Qa.documentMetadata.exists||++t;const n=H.fromString(e.Qa.documentMetadata.name);this.collectionGroups.add(n.get(n.length-2))}else e.Qa.document&&(this.Wa[this.Wa.length-1].document=e.Qa.document,++t);return t!==this.progress.documentsLoaded?(this.progress.documentsLoaded=t,{...this.progress}):null}za(e){const t=new Map,n=new ff(this.serializer);for(const i of e)if(i.metadata.queries){const s=n.$s(i.metadata.name);for(const o of i.metadata.queries){const c=(t.get(o)||K()).add(s);t.set(o,c)}}return t}async ja(e){const t=await Kw(e,new ff(this.serializer),this.Wa,this.Ua.id),n=this.za(this.documents);for(const i of this.Ka)await Ww(e,i,n.get(i.name));return this.progress.taskState="Success",{progress:this.progress,Ja:this.collectionGroups,Ha:t}}}function Rg(r){return{taskState:"Running",documentsLoaded:0,bytesLoaded:0,totalDocuments:r.totalDocuments,totalBytes:r.totalBytes}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sg{constructor(e){this.key=e}}class bg{constructor(e){this.key=e}}class Pg{constructor(e,t){this.query=e,this.Ya=t,this.Za=null,this.hasCachedResults=!1,this.current=!1,this.Xa=K(),this.mutatedKeys=K(),this.eu=mm(e),this.tu=new Kn(this.eu)}get nu(){return this.Ya}ru(e,t){const n=t?t.iu:new lf,i=t?t.tu:this.tu;let s=t?t.mutatedKeys:this.mutatedKeys,o=i,c=!1;const u=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,l=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((f,p)=>{const g=i.get(f),v=Vs(this.query,p)?p:null,D=!!g&&this.mutatedKeys.has(g.key),k=!!v&&(v.hasLocalMutations||this.mutatedKeys.has(v.key)&&v.hasCommittedMutations);let V=!1;g&&v?g.data.isEqual(v.data)?D!==k&&(n.track({type:3,doc:v}),V=!0):this.su(g,v)||(n.track({type:2,doc:v}),V=!0,(u&&this.eu(v,u)>0||l&&this.eu(v,l)<0)&&(c=!0)):!g&&v?(n.track({type:0,doc:v}),V=!0):g&&!v&&(n.track({type:1,doc:g}),V=!0,(u||l)&&(c=!0)),V&&(v?(o=o.add(v),s=k?s.add(f):s.delete(f)):(o=o.delete(f),s=s.delete(f)))}),this.query.limit!==null)for(;o.size>this.query.limit;){const f=this.query.limitType==="F"?o.last():o.first();o=o.delete(f.key),s=s.delete(f.key),n.track({type:1,doc:f})}return{tu:o,iu:n,Cs:c,mutatedKeys:s}}su(e,t){return e.hasLocalMutations&&t.hasCommittedMutations&&!t.hasLocalMutations}applyChanges(e,t,n,i){const s=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort((f,p)=>function(v,D){const k=V=>{switch(V){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return F(20277,{Rt:V})}};return k(v)-k(D)}(f.type,p.type)||this.eu(f.doc,p.doc)),this.ou(n),i=i??!1;const c=t&&!i?this._u():[],u=this.Xa.size===0&&this.current&&!i?1:0,l=u!==this.Za;return this.Za=u,o.length!==0||l?{snapshot:new ir(this.query,e.tu,s,o,e.mutatedKeys,u===0,l,!1,!!n&&n.resumeToken.approximateByteSize()>0),au:c}:{au:c}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new lf,mutatedKeys:this.mutatedKeys,Cs:!1},!1)):{au:[]}}uu(e){return!this.Ya.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(t=>this.Ya=this.Ya.add(t)),e.modifiedDocuments.forEach(t=>{}),e.removedDocuments.forEach(t=>this.Ya=this.Ya.delete(t)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Xa;this.Xa=K(),this.tu.forEach(n=>{this.uu(n.key)&&(this.Xa=this.Xa.add(n.key))});const t=[];return e.forEach(n=>{this.Xa.has(n)||t.push(new bg(n))}),this.Xa.forEach(n=>{e.has(n)||t.push(new Sg(n))}),t}cu(e){this.Ya=e.Qs,this.Xa=K();const t=this.ru(e.documents);return this.applyChanges(t,!0)}lu(){return ir.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Za===0,this.hasCachedResults)}}const vn="SyncEngine";class Iv{constructor(e,t,n){this.query=e,this.targetId=t,this.view=n}}class Ev{constructor(e){this.key=e,this.hu=!1}}class Tv{constructor(e,t,n,i,s,o){this.localStore=e,this.remoteStore=t,this.eventManager=n,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new Ut(c=>fm(c),ks),this.Iu=new Map,this.Eu=new Set,this.du=new ce(x.comparator),this.Au=new Map,this.Ru=new ju,this.Vu={},this.mu=new Map,this.fu=nr.cr(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function wv(r,e,t=!0){const n=Ea(r);let i;const s=n.Tu.get(e);return s?(n.sharedClientState.addLocalQueryTarget(s.targetId),i=s.view.lu()):i=await Cg(n,e,t,!0),i}async function vv(r,e){const t=Ea(r);await Cg(t,e,!0,!1)}async function Cg(r,e,t,n){const i=await Wr(r.localStore,qe(e)),s=i.targetId,o=r.sharedClientState.addLocalQueryTarget(s,t);let c;return n&&(c=await ol(r,e,s,o==="current",i.resumeToken)),r.isPrimaryClient&&t&&Ia(r.remoteStore,i),c}async function ol(r,e,t,n,i){r.pu=(p,g,v)=>async function(k,V,U,G){let q=V.view.ru(U);q.Cs&&(q=await Go(k.localStore,V.query,!1).then(({documents:E})=>V.view.ru(E,q)));const ee=G&&G.targetChanges.get(V.targetId),te=G&&G.targetMismatches.get(V.targetId)!=null,X=V.view.applyChanges(q,k.isPrimaryClient,ee,te);return au(k,V.targetId,X.au),X.snapshot}(r,p,g,v);const s=await Go(r.localStore,e,!0),o=new Pg(e,s.Qs),c=o.ru(s.documents),u=xs.createSynthesizedTargetChangeForCurrentChange(t,n&&r.onlineState!=="Offline",i),l=o.applyChanges(c,r.isPrimaryClient,u);au(r,t,l.au);const f=new Iv(e,t,o);return r.Tu.set(e,f),r.Iu.has(t)?r.Iu.get(t).push(e):r.Iu.set(t,[e]),l.snapshot}async function Av(r,e,t){const n=M(r),i=n.Tu.get(e),s=n.Iu.get(i.targetId);if(s.length>1)return n.Iu.set(i.targetId,s.filter(o=>!ks(o,e))),void n.Tu.delete(e);n.isPrimaryClient?(n.sharedClientState.removeLocalQueryTarget(i.targetId),n.sharedClientState.isActiveQueryTarget(i.targetId)||await Hr(n.localStore,i.targetId,!1).then(()=>{n.sharedClientState.clearQueryState(i.targetId),t&&Qr(n.remoteStore,i.targetId),Jr(n,i.targetId)}).catch(In)):(Jr(n,i.targetId),await Hr(n.localStore,i.targetId,!0))}async function Rv(r,e){const t=M(r),n=t.Tu.get(e),i=t.Iu.get(n.targetId);t.isPrimaryClient&&i.length===1&&(t.sharedClientState.removeLocalQueryTarget(n.targetId),Qr(t.remoteStore,n.targetId))}async function Sv(r,e,t){const n=ll(r);try{const i=await function(o,c){const u=M(o),l=ne.now(),f=c.reduce((v,D)=>v.add(D.key),K());let p,g;return u.persistence.runTransaction("Locally write mutations","readwrite",v=>{let D=Qe(),k=K();return u.Ns.getEntries(v,f).next(V=>{D=V,D.forEach((U,G)=>{G.isValidDocument()||(k=k.add(U))})}).next(()=>u.localDocuments.getOverlayedDocuments(v,D)).next(V=>{p=V;const U=[];for(const G of c){const q=YT(G,p.get(G.key).overlayedDocument);q!=null&&U.push(new Bt(G.key,q,nm(q.value.mapValue),ge.exists(!0)))}return u.mutationQueue.addMutationBatch(v,l,U,c)}).next(V=>{g=V;const U=V.applyToLocalDocumentSet(p,k);return u.documentOverlayCache.saveOverlays(v,V.batchId,U)})}).then(()=>({batchId:g.batchId,changes:_m(p)}))}(n.localStore,e);n.sharedClientState.addPendingMutation(i.batchId),function(o,c,u){let l=o.Vu[o.currentUser.toKey()];l||(l=new ce($)),l=l.insert(c,u),o.Vu[o.currentUser.toKey()]=l}(n,i.batchId,t),await qt(n,i.changes),await ci(n.remoteStore)}catch(i){const s=li(i,"Failed to persist write");t.reject(s)}}async function Dg(r,e){const t=M(r);try{const n=await Gw(t.localStore,e);e.targetChanges.forEach((i,s)=>{const o=t.Au.get(s);o&&(B(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?o.hu=!0:i.modifiedDocuments.size>0?B(o.hu,14607):i.removedDocuments.size>0&&(B(o.hu,42227),o.hu=!1))}),await qt(t,n,e)}catch(n){await In(n)}}function pf(r,e,t){const n=M(r);if(n.isPrimaryClient&&t===0||!n.isPrimaryClient&&t===1){const i=[];n.Tu.forEach((s,o)=>{const c=o.view.va(e);c.snapshot&&i.push(c.snapshot)}),function(o,c){const u=M(o);u.onlineState=c;let l=!1;u.queries.forEach((f,p)=>{for(const g of p.Sa)g.va(c)&&(l=!0)}),l&&rl(u)}(n.eventManager,e),i.length&&n.Pu.H_(i),n.onlineState=e,n.isPrimaryClient&&n.sharedClientState.setOnlineState(e)}}async function bv(r,e,t){const n=M(r);n.sharedClientState.updateQueryState(e,"rejected",t);const i=n.Au.get(e),s=i&&i.key;if(s){let o=new ce(x.comparator);o=o.insert(s,le.newNoDocument(s,j.min()));const c=K().add(s),u=new Os(j.min(),new Map,new ce($),o,c);await Dg(n,u),n.du=n.du.remove(s),n.Au.delete(e),ul(n)}else await Hr(n.localStore,e,!1).then(()=>Jr(n,e,t)).catch(In)}async function Pv(r,e){const t=M(r),n=e.batch.batchId;try{const i=await jw(t.localStore,e);cl(t,n,null),al(t,n),t.sharedClientState.updateMutationState(n,"acknowledged"),await qt(t,i)}catch(i){await In(i)}}async function Cv(r,e,t){const n=M(r);try{const i=await function(o,c){const u=M(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",l=>{let f;return u.mutationQueue.lookupMutationBatch(l,c).next(p=>(B(p!==null,37113),f=p.keys(),u.mutationQueue.removeMutationBatch(l,p))).next(()=>u.mutationQueue.performConsistencyCheck(l)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(l,f,c)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(l,f)).next(()=>u.localDocuments.getDocuments(l,f))})}(n.localStore,e);cl(n,e,t),al(n,e),n.sharedClientState.updateMutationState(e,"rejected",t),await qt(n,i)}catch(i){await In(i)}}async function Dv(r,e){const t=M(r);wn(t.remoteStore)||N(vn,"The network is disabled. The task returned by 'awaitPendingWrites()' will not complete until the network is enabled.");try{const n=await function(o){const c=M(o);return c.persistence.runTransaction("Get highest unacknowledged batch id","readonly",u=>c.mutationQueue.getHighestUnacknowledgedBatchId(u))}(t.localStore);if(n===an)return void e.resolve();const i=t.mu.get(n)||[];i.push(e),t.mu.set(n,i)}catch(n){const i=li(n,"Initialization of waitForPendingWrites() operation failed");e.reject(i)}}function al(r,e){(r.mu.get(e)||[]).forEach(t=>{t.resolve()}),r.mu.delete(e)}function cl(r,e,t){const n=M(r);let i=n.Vu[n.currentUser.toKey()];if(i){const s=i.get(e);s&&(t?s.reject(t):s.resolve(),i=i.remove(e)),n.Vu[n.currentUser.toKey()]=i}}function Jr(r,e,t=null){r.sharedClientState.removeLocalQueryTarget(e);for(const n of r.Iu.get(e))r.Tu.delete(n),t&&r.Pu.yu(n,t);r.Iu.delete(e),r.isPrimaryClient&&r.Ru.jr(e).forEach(n=>{r.Ru.containsKey(n)||kg(r,n)})}function kg(r,e){r.Eu.delete(e.path.canonicalString());const t=r.du.get(e);t!==null&&(Qr(r.remoteStore,t),r.du=r.du.remove(e),r.Au.delete(t),ul(r))}function au(r,e,t){for(const n of t)n instanceof Sg?(r.Ru.addReference(n.key,e),kv(r,n)):n instanceof bg?(N(vn,"Document no longer in limbo: "+n.key),r.Ru.removeReference(n.key,e),r.Ru.containsKey(n.key)||kg(r,n.key)):F(19791,{wu:n})}function kv(r,e){const t=e.key,n=t.path.canonicalString();r.du.get(t)||r.Eu.has(n)||(N(vn,"New document in limbo: "+t),r.Eu.add(n),ul(r))}function ul(r){for(;r.Eu.size>0&&r.du.size<r.maxConcurrentLimboResolutions;){const e=r.Eu.values().next().value;r.Eu.delete(e);const t=new x(H.fromString(e)),n=r.fu.next();r.Au.set(n,new Ev(t)),r.du=r.du.insert(t,n),Ia(r.remoteStore,new Pt(qe(ii(t.path)),n,"TargetPurposeLimboResolution",We.ce))}}async function qt(r,e,t){const n=M(r),i=[],s=[],o=[];n.Tu.isEmpty()||(n.Tu.forEach((c,u)=>{o.push(n.pu(u,e,t).then(l=>{if((l||t)&&n.isPrimaryClient){const f=l?!l.fromCache:t?.targetChanges.get(u.targetId)?.current;n.sharedClientState.updateQueryState(u.targetId,f?"current":"not-current")}if(l){i.push(l);const f=Wu.As(u.targetId,l);s.push(f)}}))}),await Promise.all(o),n.Pu.H_(i),await async function(u,l){const f=M(u);try{await f.persistence.runTransaction("notifyLocalViewChanges","readwrite",p=>A.forEach(l,g=>A.forEach(g.Es,v=>f.persistence.referenceDelegate.addReference(p,g.targetId,v)).next(()=>A.forEach(g.ds,v=>f.persistence.referenceDelegate.removeReference(p,g.targetId,v)))))}catch(p){if(!En(p))throw p;N(Hu,"Failed to update sequence numbers: "+p)}for(const p of l){const g=p.targetId;if(!p.fromCache){const v=f.Ms.get(g),D=v.snapshotVersion,k=v.withLastLimboFreeSnapshotVersion(D);f.Ms=f.Ms.insert(g,k)}}}(n.localStore,s))}async function Vv(r,e){const t=M(r);if(!t.currentUser.isEqual(e)){N(vn,"User change. New user:",e.toKey());const n=await ag(t.localStore,e);t.currentUser=e,function(s,o){s.mu.forEach(c=>{c.forEach(u=>{u.reject(new C(S.CANCELLED,o))})}),s.mu.clear()}(t,"'waitForPendingWrites' promise is rejected due to a user change."),t.sharedClientState.handleUserChange(e,n.removedBatchIds,n.addedBatchIds),await qt(t,n.Ls)}}function Nv(r,e){const t=M(r),n=t.Au.get(e);if(n&&n.hu)return K().add(n.key);{let i=K();const s=t.Iu.get(e);if(!s)return i;for(const o of s){const c=t.Tu.get(o);i=i.unionWith(c.view.nu)}return i}}async function Ov(r,e){const t=M(r),n=await Go(t.localStore,e.query,!0),i=e.view.cu(n);return t.isPrimaryClient&&au(t,e.targetId,i.au),i}async function xv(r,e){const t=M(r);return hg(t.localStore,e).then(n=>qt(t,n))}async function Mv(r,e,t,n){const i=M(r),s=await function(c,u){const l=M(c),f=M(l.mutationQueue);return l.persistence.runTransaction("Lookup mutation documents","readonly",p=>f.er(p,u).next(g=>g?l.localDocuments.getDocuments(p,g):A.resolve(null)))}(i.localStore,e);s!==null?(t==="pending"?await ci(i.remoteStore):t==="acknowledged"||t==="rejected"?(cl(i,e,n||null),al(i,e),function(c,u){M(M(c).mutationQueue).ir(u)}(i.localStore,e)):F(6720,"Unknown batchState",{Su:t}),await qt(i,s)):N(vn,"Cannot apply mutation batch with id: "+e)}async function Lv(r,e){const t=M(r);if(Ea(t),ll(t),e===!0&&t.gu!==!0){const n=t.sharedClientState.getAllActiveQueryTargets(),i=await mf(t,n.toArray());t.gu=!0,await su(t.remoteStore,!0);for(const s of i)Ia(t.remoteStore,s)}else if(e===!1&&t.gu!==!1){const n=[];let i=Promise.resolve();t.Iu.forEach((s,o)=>{t.sharedClientState.isLocalQueryTarget(o)?n.push(o):i=i.then(()=>(Jr(t,o),Hr(t.localStore,o,!0))),Qr(t.remoteStore,o)}),await i,await mf(t,n),function(o){const c=M(o);c.Au.forEach((u,l)=>{Qr(c.remoteStore,l)}),c.Ru.Jr(),c.Au=new Map,c.du=new ce(x.comparator)}(t),t.gu=!1,await su(t.remoteStore,!1)}}async function mf(r,e,t){const n=M(r),i=[],s=[];for(const o of e){let c;const u=n.Iu.get(o);if(u&&u.length!==0){c=await Wr(n.localStore,qe(u[0]));for(const l of u){const f=n.Tu.get(l),p=await Ov(n,f);p.snapshot&&s.push(p.snapshot)}}else{const l=await lg(n.localStore,o);c=await Wr(n.localStore,l),await ol(n,Vg(l),o,!1,c.resumeToken)}i.push(c)}return n.Pu.H_(s),i}function Vg(r){return lm(r.path,r.collectionGroup,r.orderBy,r.filters,r.limit,"F",r.startAt,r.endAt)}function Fv(r){return function(t){return M(M(t).persistence).Ts()}(M(r).localStore)}async function Uv(r,e,t,n){const i=M(r);if(i.gu)return void N(vn,"Ignoring unexpected query state notification.");const s=i.Iu.get(e);if(s&&s.length>0)switch(t){case"current":case"not-current":{const o=await hg(i.localStore,pm(s[0])),c=Os.createSynthesizedRemoteEventForCurrentChange(e,t==="current",ye.EMPTY_BYTE_STRING);await qt(i,o,c);break}case"rejected":await Hr(i.localStore,e,!0),Jr(i,e,n);break;default:F(64155,t)}}async function Bv(r,e,t){const n=Ea(r);if(n.gu){for(const i of e){if(n.Iu.has(i)&&n.sharedClientState.isActiveQueryTarget(i)){N(vn,"Adding an already active target "+i);continue}const s=await lg(n.localStore,i),o=await Wr(n.localStore,s);await ol(n,Vg(s),o.targetId,!1,o.resumeToken),Ia(n.remoteStore,o)}for(const i of t)n.Iu.has(i)&&await Hr(n.localStore,i,!1).then(()=>{Qr(n.remoteStore,i),Jr(n,i)}).catch(In)}}function Ea(r){const e=M(r);return e.remoteStore.remoteSyncer.applyRemoteEvent=Dg.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=Nv.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=bv.bind(null,e),e.Pu.H_=_v.bind(null,e.eventManager),e.Pu.yu=yv.bind(null,e.eventManager),e}function ll(r){const e=M(r);return e.remoteStore.remoteSyncer.applySuccessfulWrite=Pv.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=Cv.bind(null,e),e}function qv(r,e,t){const n=M(r);(async function(s,o,c){try{const u=await o.getMetadata();if(await function(v,D){const k=M(v),V=we(D.createTime);return k.persistence.runTransaction("hasNewerBundle","readonly",U=>k.Ii.getBundleMetadata(U,D.id)).then(U=>!!U&&U.createTime.compareTo(V)>=0)}(s.localStore,u))return await o.close(),c._completeWith(function(v){return{taskState:"Success",documentsLoaded:v.totalDocuments,bytesLoaded:v.totalBytes,totalDocuments:v.totalDocuments,totalBytes:v.totalBytes}}(u)),Promise.resolve(new Set);c._updateProgress(Rg(u));const l=new sl(u,o.serializer);let f=await o.bu();for(;f;){const g=await l.Ga(f);g&&c._updateProgress(g),f=await o.bu()}const p=await l.ja(s.localStore);return await qt(s,p.Ha,void 0),await function(v,D){const k=M(v);return k.persistence.runTransaction("Save bundle","readwrite",V=>k.Ii.saveBundleMetadata(V,D))}(s.localStore,u),c._completeWith(p.progress),Promise.resolve(p.Ja)}catch(u){return nt(vn,`Loading bundle failed with ${u}`),c._failWith(u),Promise.resolve(new Set)}})(n,e,t).then(i=>{n.sharedClientState.notifyBundleLoaded(i)})}class Yr{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=cr(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,t){return null}Mu(e,t){return null}vu(e){return og(this.persistence,new sg,e.initialUser,this.serializer)}Cu(e){return new Gu(ya.mi,this.serializer)}Du(e){return new gg}async terminate(){this.gcScheduler?.stop(),this.indexBackfillerScheduler?.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Yr.provider={build:()=>new Yr};class hl extends Yr{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,t){B(this.persistence.referenceDelegate instanceof jo,46915);const n=this.persistence.referenceDelegate.garbageCollector;return new Zm(n,e.asyncQueue,t)}Cu(e){const t=this.cacheSizeBytes!==void 0?Ue.withCacheSize(this.cacheSizeBytes):Ue.DEFAULT;return new Gu(n=>jo.mi(n,t),this.serializer)}}class dl extends Yr{constructor(e,t,n){super(),this.xu=e,this.cacheSizeBytes=t,this.forceOwnership=n,this.kind="persistent",this.synchronizeTabs=!1}async initialize(e){await super.initialize(e),await this.xu.initialize(this,e),await ll(this.xu.syncEngine),await ci(this.xu.remoteStore),await this.persistence.Ji(()=>(this.gcScheduler&&!this.gcScheduler.started&&this.gcScheduler.start(),this.indexBackfillerScheduler&&!this.indexBackfillerScheduler.started&&this.indexBackfillerScheduler.start(),Promise.resolve()))}vu(e){return og(this.persistence,new sg,e.initialUser,this.serializer)}Fu(e,t){const n=this.persistence.referenceDelegate.garbageCollector;return new Zm(n,e.asyncQueue,t)}Mu(e,t){const n=new tT(t,this.persistence);return new eT(e.asyncQueue,n)}Cu(e){const t=Ku(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey),n=this.cacheSizeBytes!==void 0?Ue.withCacheSize(this.cacheSizeBytes):Ue.DEFAULT;return new $u(this.synchronizeTabs,t,e.clientId,n,e.asyncQueue,_g(),bo(),this.serializer,this.sharedClientState,!!this.forceOwnership)}Du(e){return new gg}}class Ng extends dl{constructor(e,t){super(e,t,!1),this.xu=e,this.cacheSizeBytes=t,this.synchronizeTabs=!0}async initialize(e){await super.initialize(e);const t=this.xu.syncEngine;this.sharedClientState instanceof Ec&&(this.sharedClientState.syncEngine={Co:Mv.bind(null,t),vo:Uv.bind(null,t),Fo:Bv.bind(null,t),Ts:Fv.bind(null,t),Do:xv.bind(null,t)},await this.sharedClientState.start()),await this.persistence.Ji(async n=>{await Lv(this.xu.syncEngine,n),this.gcScheduler&&(n&&!this.gcScheduler.started?this.gcScheduler.start():n||this.gcScheduler.stop()),this.indexBackfillerScheduler&&(n&&!this.indexBackfillerScheduler.started?this.indexBackfillerScheduler.start():n||this.indexBackfillerScheduler.stop())})}Du(e){const t=_g();if(!Ec.v(t))throw new C(S.UNIMPLEMENTED,"IndexedDB persistence is only available on platforms that support LocalStorage.");const n=Ku(e.databaseInfo.databaseId,e.databaseInfo.persistenceKey);return new Ec(t,e.asyncQueue,n,e.clientId,e.initialUser)}}class _n{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=n=>pf(this.syncEngine,n,1),this.remoteStore.remoteSyncer.handleCredentialChange=Vv.bind(null,this.syncEngine),await su(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new gv}()}createDatastore(e){const t=cr(e.databaseInfo.databaseId),n=function(s){return new Xw(s)}(e.databaseInfo);return function(s,o,c,u){return new nv(s,o,c,u)}(e.authCredentials,e.appCheckCredentials,n,t)}createRemoteStore(e){return function(n,i,s,o,c){return new iv(n,i,s,o,c)}(this.localStore,this.datastore,e.asyncQueue,t=>pf(this.syncEngine,t,0),function(){return af.v()?new af:new Hw}())}createSyncEngine(e,t){return function(i,s,o,c,u,l,f){const p=new Tv(i,s,o,c,u,l);return f&&(p.gu=!0),p}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){await async function(t){const n=M(t);N(rr,"RemoteStore shutting down."),n.Ea.add(5),await ai(n),n.Aa.shutdown(),n.Ra.set("Unknown")}(this.remoteStore),this.datastore?.terminate(),this.eventManager?.terminate()}}_n.provider={build:()=>new _n};function gf(r,e=10240){let t=0;return{async read(){if(t<r.byteLength){const n={value:r.slice(t,t+e),done:!1};return t+=e,n}return{done:!0}},async cancel(){},releaseLock(){},closed:Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ta{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):Te("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,t){setTimeout(()=>{this.muted||e(t)},0)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zv{constructor(e,t){this.Bu=e,this.serializer=t,this.metadata=new Ne,this.buffer=new Uint8Array,this.Lu=function(){return new TextDecoder("utf-8")}(),this.ku().then(n=>{n&&n.$a()?this.metadata.resolve(n.Qa.metadata):this.metadata.reject(new Error(`The first element of the bundle is not a metadata, it is
             ${JSON.stringify(n?.Qa)}`))},n=>this.metadata.reject(n))}close(){return this.Bu.cancel()}async getMetadata(){return this.metadata.promise}async bu(){return await this.getMetadata(),this.ku()}async ku(){const e=await this.qu();if(e===null)return null;const t=this.Lu.decode(e),n=Number(t);isNaN(n)&&this.Qu(`length string (${t}) is not valid number`);const i=await this.$u(n);return new Ag(JSON.parse(i),e.length+n)}Uu(){return this.buffer.findIndex(e=>e===123)}async qu(){for(;this.Uu()<0&&!await this.Ku(););if(this.buffer.length===0)return null;const e=this.Uu();e<0&&this.Qu("Reached the end of bundle when a length string is expected.");const t=this.buffer.slice(0,e);return this.buffer=this.buffer.slice(e),t}async $u(e){for(;this.buffer.length<e;)await this.Ku()&&this.Qu("Reached the end of bundle when more is expected.");const t=this.Lu.decode(this.buffer.slice(0,e));return this.buffer=this.buffer.slice(e),t}Qu(e){throw this.Bu.cancel(),new Error(`Invalid bundle format: ${e}`)}async Ku(){const e=await this.Bu.read();if(!e.done){const t=new Uint8Array(this.buffer.length+e.value.length);t.set(this.buffer),t.set(e.value,this.buffer.length),this.buffer=t}return e.done}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jv{constructor(e,t){this.bundleData=e,this.serializer=t,this.cursor=0,this.elements=[];let n=this.bu();if(!n||!n.$a())throw new Error(`The first element of the bundle is not a metadata object, it is
         ${JSON.stringify(n?.Qa)}`);this.metadata=n;do n=this.bu(),n!==null&&this.elements.push(n);while(n!==null)}getMetadata(){return this.metadata}Wu(){return this.elements}bu(){if(this.cursor===this.bundleData.length)return null;const e=this.qu(),t=this.$u(e);return new Ag(JSON.parse(t),e)}$u(e){if(this.cursor+e>this.bundleData.length)throw new C(S.INTERNAL,"Reached the end of bundle when more is expected.");return this.bundleData.slice(this.cursor,this.cursor+=e)}qu(){const e=this.cursor;let t=this.cursor;for(;t<this.bundleData.length;){if(this.bundleData[t]==="{"){if(t===e)throw new Error("First character is a bracket and not a number");return this.cursor=t,Number(this.bundleData.slice(e,t))}t++}throw new Error("Reached the end of bundle when more is expected.")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gv{constructor(e){this.datastore=e,this.readVersions=new Map,this.mutations=[],this.committed=!1,this.lastTransactionError=null,this.writtenDocs=new Set}async lookup(e){if(this.ensureCommitNotCalled(),this.mutations.length>0)throw this.lastTransactionError=new C(S.INVALID_ARGUMENT,"Firestore transactions require all reads to be executed before all writes."),this.lastTransactionError;const t=await async function(i,s){const o=M(i),c={documents:s.map(p=>Is(o.serializer,p))},u=await o.Ho("BatchGetDocuments",o.serializer.databaseId,H.emptyPath(),c,s.length),l=new Map;u.forEach(p=>{const g=ow(o.serializer,p);l.set(g.key.toString(),g)});const f=[];return s.forEach(p=>{const g=l.get(p.toString());B(!!g,55234,{key:p}),f.push(g)}),f}(this.datastore,e);return t.forEach(n=>this.recordVersion(n)),t}set(e,t){this.write(t.toMutation(e,this.precondition(e))),this.writtenDocs.add(e.toString())}update(e,t){try{this.write(t.toMutation(e,this.preconditionForUpdate(e)))}catch(n){this.lastTransactionError=n}this.writtenDocs.add(e.toString())}delete(e){this.write(new oi(e,this.precondition(e))),this.writtenDocs.add(e.toString())}async commit(){if(this.ensureCommitNotCalled(),this.lastTransactionError)throw this.lastTransactionError;const e=this.readVersions;this.mutations.forEach(t=>{e.delete(t.key.toString())}),e.forEach((t,n)=>{const i=x.fromPath(n);this.mutations.push(new xu(i,this.precondition(i)))}),await async function(n,i){const s=M(n),o={writes:i.map(c=>Es(s.serializer,c))};await s.Go("Commit",s.serializer.databaseId,H.emptyPath(),o)}(this.datastore,this.mutations),this.committed=!0}recordVersion(e){let t;if(e.isFoundDocument())t=e.version;else{if(!e.isNoDocument())throw F(50498,{Gu:e.constructor.name});t=j.min()}const n=this.readVersions.get(e.key.toString());if(n){if(!t.isEqual(n))throw new C(S.ABORTED,"Document version changed between two reads.")}else this.readVersions.set(e.key.toString(),t)}precondition(e){const t=this.readVersions.get(e.toString());return!this.writtenDocs.has(e.toString())&&t?t.isEqual(j.min())?ge.exists(!1):ge.updateTime(t):ge.none()}preconditionForUpdate(e){const t=this.readVersions.get(e.toString());if(!this.writtenDocs.has(e.toString())&&t){if(t.isEqual(j.min()))throw new C(S.INVALID_ARGUMENT,"Can't update a document that doesn't exist.");return ge.updateTime(t)}return ge.exists(!0)}write(e){this.ensureCommitNotCalled(),this.mutations.push(e)}ensureCommitNotCalled(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $v{constructor(e,t,n,i,s){this.asyncQueue=e,this.datastore=t,this.options=n,this.updateFunction=i,this.deferred=s,this.zu=n.maxAttempts,this.M_=new Ju(this.asyncQueue,"transaction_retry")}ju(){this.zu-=1,this.Ju()}Ju(){this.M_.p_(async()=>{const e=new Gv(this.datastore),t=this.Hu(e);t&&t.then(n=>{this.asyncQueue.enqueueAndForget(()=>e.commit().then(()=>{this.deferred.resolve(n)}).catch(i=>{this.Yu(i)}))}).catch(n=>{this.Yu(n)})})}Hu(e){try{const t=this.updateFunction(e);return!Ps(t)&&t.catch&&t.then?t:(this.deferred.reject(Error("Transaction callback must return a Promise")),null)}catch(t){return this.deferred.reject(t),null}}Yu(e){this.zu>0&&this.Zu(e)?(this.zu-=1,this.asyncQueue.enqueueAndForget(()=>(this.Ju(),Promise.resolve()))):this.deferred.reject(e)}Zu(e){if(e?.name==="FirebaseError"){const t=e.code;return t==="aborted"||t==="failed-precondition"||t==="already-exists"||!Pm(t)}return!1}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yn="FirestoreClient";class Kv{constructor(e,t,n,i,s){this.authCredentials=e,this.appCheckCredentials=t,this.asyncQueue=n,this.databaseInfo=i,this.user=Ve.UNAUTHENTICATED,this.clientId=na.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(n,async o=>{N(yn,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(n,o=>(N(yn,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this.databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new Ne;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(t){const n=li(t,"Failed to shutdown persistence");e.reject(n)}}),e.promise}}async function wc(r,e){r.asyncQueue.verifyOperationInProgress(),N(yn,"Initializing OfflineComponentProvider");const t=r.configuration;await e.initialize(t);let n=t.initialUser;r.setCredentialChangeListener(async i=>{n.isEqual(i)||(await ag(e.localStore,i),n=i)}),e.persistence.setDatabaseDeletedListener(()=>r.terminate()),r._offlineComponents=e}async function _f(r,e){r.asyncQueue.verifyOperationInProgress();const t=await fl(r);N(yn,"Initializing OnlineComponentProvider"),await e.initialize(t,r.configuration),r.setCredentialChangeListener(n=>uf(e.remoteStore,n)),r.setAppCheckTokenChangeListener((n,i)=>uf(e.remoteStore,i)),r._onlineComponents=e}async function fl(r){if(!r._offlineComponents)if(r._uninitializedComponentsProvider){N(yn,"Using user provided OfflineComponentProvider");try{await wc(r,r._uninitializedComponentsProvider._offline)}catch(e){const t=e;if(!function(i){return i.name==="FirebaseError"?i.code===S.FAILED_PRECONDITION||i.code===S.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(t))throw t;nt("Error using user provided cache. Falling back to memory cache: "+t),await wc(r,new Yr)}}else N(yn,"Using default OfflineComponentProvider"),await wc(r,new hl(void 0));return r._offlineComponents}async function wa(r){return r._onlineComponents||(r._uninitializedComponentsProvider?(N(yn,"Using user provided OnlineComponentProvider"),await _f(r,r._uninitializedComponentsProvider._online)):(N(yn,"Using default OnlineComponentProvider"),await _f(r,new _n))),r._onlineComponents}function Og(r){return fl(r).then(e=>e.persistence)}function hi(r){return fl(r).then(e=>e.localStore)}function xg(r){return wa(r).then(e=>e.remoteStore)}function pl(r){return wa(r).then(e=>e.syncEngine)}function Mg(r){return wa(r).then(e=>e.datastore)}async function Xr(r){const e=await wa(r),t=e.eventManager;return t.onListen=wv.bind(null,e.syncEngine),t.onUnlisten=Av.bind(null,e.syncEngine),t.onFirstRemoteStoreListen=vv.bind(null,e.syncEngine),t.onLastRemoteStoreUnlisten=Rv.bind(null,e.syncEngine),t}function Wv(r){return r.asyncQueue.enqueue(async()=>{const e=await Og(r),t=await xg(r);return e.setNetworkEnabled(!0),function(i){const s=M(i);return s.Ea.delete(0),Ms(s)}(t)})}function Hv(r){return r.asyncQueue.enqueue(async()=>{const e=await Og(r),t=await xg(r);return e.setNetworkEnabled(!1),async function(i){const s=M(i);s.Ea.add(0),await ai(s),s.Ra.set("Offline")}(t)})}function Qv(r,e){const t=new Ne;return r.asyncQueue.enqueueAndForget(async()=>async function(i,s,o){try{const c=await function(l,f){const p=M(l);return p.persistence.runTransaction("read document","readonly",g=>p.localDocuments.getDocument(g,f))}(i,s);c.isFoundDocument()?o.resolve(c):c.isNoDocument()?o.resolve(null):o.reject(new C(S.UNAVAILABLE,"Failed to get document from cache. (However, this document may exist on the server. Run again without setting 'source' in the GetOptions to attempt to retrieve the document from the server.)"))}catch(c){const u=li(c,`Failed to get document '${s} from cache`);o.reject(u)}}(await hi(r),e,t)),t.promise}function Lg(r,e,t={}){const n=new Ne;return r.asyncQueue.enqueueAndForget(async()=>function(s,o,c,u,l){const f=new Ta({next:g=>{f.Nu(),o.enqueueAndForget(()=>nl(s,p));const v=g.docs.has(c);!v&&g.fromCache?l.reject(new C(S.UNAVAILABLE,"Failed to get document because the client is offline.")):v&&g.fromCache&&u&&u.source==="server"?l.reject(new C(S.UNAVAILABLE,'Failed to get document from server. (However, this document does exist in the local cache. Run again without setting source to "server" to retrieve the cached document.)')):l.resolve(g)},error:g=>l.reject(g)}),p=new il(ii(c.path),f,{includeMetadataChanges:!0,qa:!0});return tl(s,p)}(await Xr(r),r.asyncQueue,e,t,n)),n.promise}function Jv(r,e){const t=new Ne;return r.asyncQueue.enqueueAndForget(async()=>async function(i,s,o){try{const c=await Go(i,s,!0),u=new Pg(s,c.Qs),l=u.ru(c.documents),f=u.applyChanges(l,!1);o.resolve(f.snapshot)}catch(c){const u=li(c,`Failed to execute query '${s} against cache`);o.reject(u)}}(await hi(r),e,t)),t.promise}function Fg(r,e,t={}){const n=new Ne;return r.asyncQueue.enqueueAndForget(async()=>function(s,o,c,u,l){const f=new Ta({next:g=>{f.Nu(),o.enqueueAndForget(()=>nl(s,p)),g.fromCache&&u.source==="server"?l.reject(new C(S.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):l.resolve(g)},error:g=>l.reject(g)}),p=new il(c,f,{includeMetadataChanges:!0,qa:!0});return tl(s,p)}(await Xr(r),r.asyncQueue,e,t,n)),n.promise}function Yv(r,e,t){const n=new Ne;return r.asyncQueue.enqueueAndForget(async()=>{try{const i=await Mg(r);n.resolve(async function(o,c,u){const l=M(o),{request:f,gt:p,parent:g}=Um(l.serializer,hm(c),u);l.connection.$o||delete f.parent;const v=(await l.Ho("RunAggregationQuery",l.serializer.databaseId,g,f,1)).filter(k=>!!k.result);B(v.length===1,64727);const D=v[0].result?.aggregateFields;return Object.keys(D).reduce((k,V)=>(k[p[V]]=D[V],k),{})}(i,e,t))}catch(i){n.reject(i)}}),n.promise}function Xv(r,e){const t=new Ta(e);return r.asyncQueue.enqueueAndForget(async()=>function(i,s){M(i).Ca.add(s),s.next()}(await Xr(r),t)),()=>{t.Nu(),r.asyncQueue.enqueueAndForget(async()=>function(i,s){M(i).Ca.delete(s)}(await Xr(r),t))}}function Zv(r,e,t,n){const i=function(o,c){let u;return u=typeof o=="string"?Dm().encode(o):o,function(f,p){return new zv(f,p)}(function(f,p){if(f instanceof Uint8Array)return gf(f,p);if(f instanceof ArrayBuffer)return gf(new Uint8Array(f),p);if(f instanceof ReadableStream)return f.getReader();throw new Error("Source of `toByteStreamReader` has to be a ArrayBuffer or ReadableStream")}(u),c)}(t,cr(e));r.asyncQueue.enqueueAndForget(async()=>{qv(await pl(r),i,n)})}function eA(r,e){return r.asyncQueue.enqueue(async()=>function(n,i){const s=M(n);return s.persistence.runTransaction("Get named query","readonly",o=>s.Ii.getNamedQuery(o,i))}(await hi(r),e))}function Ug(r,e){return function(n,i){return new jv(n,i)}(r,e)}function tA(r,e){return r.asyncQueue.enqueue(async()=>async function(n,i){const s=M(n),o=s.indexManager,c=[];return s.persistence.runTransaction("Configure indexes","readwrite",u=>o.getFieldIndexes(u).next(l=>function(p,g,v,D,k){p=[...p],g=[...g],p.sort(v),g.sort(v);const V=p.length,U=g.length;let G=0,q=0;for(;G<U&&q<V;){const ee=v(p[q],g[G]);ee<0?k(p[q++]):ee>0?D(g[G++]):(G++,q++)}for(;G<U;)D(g[G++]);for(;q<V;)k(p[q++])}(l,i,JE,f=>{c.push(o.addFieldIndex(u,f))},f=>{c.push(o.deleteFieldIndex(u,f))})).next(()=>A.waitFor(c)))}(await hi(r),e))}function nA(r,e){return r.asyncQueue.enqueue(async()=>function(n,i){M(n).Fs.Vs=i}(await hi(r),e))}function rA(r){return r.asyncQueue.enqueue(async()=>function(t){const n=M(t),i=n.indexManager;return n.persistence.runTransaction("Delete All Indexes","readwrite",s=>i.deleteAllFieldIndexes(s))}(await hi(r)))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bg(r){const e={};return r.timeoutSeconds!==void 0&&(e.timeoutSeconds=r.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yf=new Map;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qg="firestore.googleapis.com",If=!0;class Ef{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new C(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=qg,this.ssl=If}else this.host=e.host,this.ssl=e.ssl??If;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=Hm;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Xm)throw new C(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}bp("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=Bg(e.experimentalLongPollingOptions??{}),function(n){if(n.timeoutSeconds!==void 0){if(isNaN(n.timeoutSeconds))throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (must not be NaN)`);if(n.timeoutSeconds<5)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (minimum allowed value is 5)`);if(n.timeoutSeconds>30)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${n.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(n,i){return n.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class Ls{constructor(e,t,n,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=n,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Ef({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new C(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new C(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Ef(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(n){if(!n)return new Rp;switch(n.type){case"firstParty":return new jE(n.sessionIndex||"0",n.iamToken||null,n.authTokenFactory||null);case"provider":return n.client;default:throw new C(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(t){const n=yf.get(t);n&&(N("ComponentProvider","Removing Datastore"),yf.delete(t),n.terminate())}(this),Promise.resolve()}}function zg(r,e,t,n={}){r=Q(r,Ls);const i=sr(e),s=r._getSettings(),o={...s,emulatorOptions:r._getEmulatorOptions()},c=`${e}:${t}`;i&&(mu(`https://${c}`),ep("Firestore",!0)),s.host!==qg&&s.host!==c&&nt("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...s,host:c,ssl:i,emulatorOptions:n};if(!lt(u,o)&&(r._setSettings(u),n.mockUserToken)){let l,f;if(typeof n.mockUserToken=="string")l=n.mockUserToken,f=Ve.MOCK_USER;else{l=oI(n.mockUserToken,r._app?.options.projectId);const p=n.mockUserToken.sub||n.mockUserToken.user_id;if(!p)throw new C(S.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");f=new Ve(p)}r._authCredentials=new BE(new Ap(l,f))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pe{constructor(e,t,n){this.converter=t,this._query=n,this.type="query",this.firestore=e}withConverter(e){return new Pe(this.firestore,e,this._query)}}class ie{constructor(e,t,n){this.converter=t,this._key=n,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new ct(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new ie(this.firestore,e,this._key)}toJSON(){return{type:ie._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,t,n){if(ar(t,ie._jsonSchema))return new ie(e,n||null,new x(H.fromString(t.referencePath)))}}ie._jsonSchemaVersion="firestore/documentReference/1.0",ie._jsonSchema={type:Re("string",ie._jsonSchemaVersion),referencePath:Re("string")};class ct extends Pe{constructor(e,t,n){super(e,t,ii(n)),this._path=n,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new ie(this.firestore,null,new x(e))}withConverter(e){return new ct(this.firestore,e,this._path)}}function iA(r,e,...t){if(r=z(r),wu("collection","path",e),r instanceof Ls){const n=H.fromString(e,...t);return ad(n),new ct(r,null,n)}{if(!(r instanceof ie||r instanceof ct))throw new C(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(H.fromString(e,...t));return ad(n),new ct(r.firestore,null,n)}}function sA(r,e){if(r=Q(r,Ls),wu("collectionGroup","collection id",e),e.indexOf("/")>=0)throw new C(S.INVALID_ARGUMENT,`Invalid collection ID '${e}' passed to function collectionGroup(). Collection IDs must not contain '/'.`);return new Pe(r,null,function(n){return new Ft(H.emptyPath(),n)}(e))}function jg(r,e,...t){if(r=z(r),arguments.length===1&&(e=na.newId()),wu("doc","path",e),r instanceof Ls){const n=H.fromString(e,...t);return od(n),new ie(r,null,new x(n))}{if(!(r instanceof ie||r instanceof ct))throw new C(S.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const n=r._path.child(H.fromString(e,...t));return od(n),new ie(r.firestore,r instanceof ct?r.converter:null,new x(n))}}function oA(r,e){return r=z(r),e=z(e),(r instanceof ie||r instanceof ct)&&(e instanceof ie||e instanceof ct)&&r.firestore===e.firestore&&r.path===e.path&&r.converter===e.converter}function ml(r,e){return r=z(r),e=z(e),r instanceof Pe&&e instanceof Pe&&r.firestore===e.firestore&&ks(r._query,e._query)&&r.converter===e.converter}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Tf="AsyncQueue";class wf{constructor(e=Promise.resolve()){this.Xu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new Ju(this,"async_queue_retry"),this._c=()=>{const n=bo();n&&N(Tf,"Visibility state changed to "+n.visibilityState),this.M_.w_()},this.ac=e;const t=bo();t&&typeof t.addEventListener=="function"&&t.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const t=bo();t&&typeof t.removeEventListener=="function"&&t.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const t=new Ne;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Xu.push(e),this.lc()))}async lc(){if(this.Xu.length!==0){try{await this.Xu[0](),this.Xu.shift(),this.M_.reset()}catch(e){if(!En(e))throw e;N(Tf,"Operation failed with retryable error: "+e)}this.Xu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const t=this.ac.then(()=>(this.rc=!0,e().catch(n=>{throw this.nc=n,this.rc=!1,Te("INTERNAL UNHANDLED ERROR: ",vf(n)),n}).then(n=>(this.rc=!1,n))));return this.ac=t,t}enqueueAfterDelay(e,t,n){this.uc(),this.oc.indexOf(e)>-1&&(t=0);const i=el.createAndSchedule(this,e,t,n,s=>this.hc(s));return this.tc.push(i),i}uc(){this.nc&&F(47125,{Pc:vf(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ic(e){for(const t of this.tc)if(t.timerId===e)return!0;return!1}Ec(e){return this.Tc().then(()=>{this.tc.sort((t,n)=>t.targetTimeMs-n.targetTimeMs);for(const t of this.tc)if(t.skipDelay(),e!=="all"&&t.timerId===e)break;return this.Tc()})}dc(e){this.oc.push(e)}hc(e){const t=this.tc.indexOf(e);this.tc.splice(t,1)}}function vf(r){let e=r.message||"";return r.stack&&(e=r.stack.includes(r.message)?r.stack:r.message+`
`+r.stack),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function br(r){return function(t,n){if(typeof t!="object"||t===null)return!1;const i=t;for(const s of n)if(s in i&&typeof i[s]=="function")return!0;return!1}(r,["next","error","complete"])}class Gg{constructor(){this._progressObserver={},this._taskCompletionResolver=new Ne,this._lastProgress={taskState:"Running",totalBytes:0,totalDocuments:0,bytesLoaded:0,documentsLoaded:0}}onProgress(e,t,n){this._progressObserver={next:e,error:t,complete:n}}catch(e){return this._taskCompletionResolver.promise.catch(e)}then(e,t){return this._taskCompletionResolver.promise.then(e,t)}_completeWith(e){this._updateProgress(e),this._progressObserver.complete&&this._progressObserver.complete(),this._taskCompletionResolver.resolve(e)}_failWith(e){this._lastProgress.taskState="Error",this._progressObserver.next&&this._progressObserver.next(this._lastProgress),this._progressObserver.error&&this._progressObserver.error(e),this._taskCompletionResolver.reject(e)}_updateProgress(e){this._lastProgress=e,this._progressObserver.next&&this._progressObserver.next(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aA=-1;class oe extends Ls{constructor(e,t,n,i){super(e,t,n,i),this.type="firestore",this._queue=new wf,this._persistenceKey=i?.name||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new wf(e),this._firestoreClient=void 0,await e}}}function cA(r,e,t){t||(t=ms);const n=ni(r,"firestore");if(n.isInitialized(t)){const i=n.getImmediate({identifier:t}),s=n.getOptions(t);if(lt(s,e))return i;throw new C(S.FAILED_PRECONDITION,"initializeFirestore() has already been called with different options. To avoid this error, call initializeFirestore() with the same options as when it was originally called, or call getFirestore() to return the already initialized instance.")}if(e.cacheSizeBytes!==void 0&&e.localCache!==void 0)throw new C(S.INVALID_ARGUMENT,"cache and cacheSizeBytes cannot be specified at the same time as cacheSizeBytes willbe deprecated. Instead, specify the cache size in the cache object");if(e.cacheSizeBytes!==void 0&&e.cacheSizeBytes!==-1&&e.cacheSizeBytes<Xm)throw new C(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");return e.host&&sr(e.host)&&mu(e.host),n.initialize({options:e,instanceIdentifier:t})}function uA(r,e){const t=typeof r=="object"?r:Eu(),n=typeof r=="string"?r:e||ms,i=ni(t,"firestore").getImmediate({identifier:n});if(!i._initialized){const s=iI("firestore");s&&zg(i,...s)}return i}function _e(r){if(r._terminated)throw new C(S.FAILED_PRECONDITION,"The client has already been terminated.");return r._firestoreClient||$g(r),r._firestoreClient}function $g(r){const e=r._freezeSettings(),t=function(i,s,o,c){return new DT(i,s,o,c.host,c.ssl,c.experimentalForceLongPolling,c.experimentalAutoDetectLongPolling,Bg(c.experimentalLongPollingOptions),c.useFetchStreams,c.isUsingEmulator)}(r._databaseId,r._app?.options.appId||"",r._persistenceKey,e);r._componentsProvider||e.localCache?._offlineComponentProvider&&e.localCache?._onlineComponentProvider&&(r._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),r._firestoreClient=new Kv(r._authCredentials,r._appCheckCredentials,r._queue,t,r._componentsProvider&&function(i){const s=i?._online.build();return{_offline:i?._offline.build(s),_online:s}}(r._componentsProvider))}function lA(r,e){nt("enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const t=r._freezeSettings();return Kg(r,_n.provider,{build:n=>new dl(n,t.cacheSizeBytes,e?.forceOwnership)}),Promise.resolve()}async function hA(r){nt("enableMultiTabIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.");const e=r._freezeSettings();Kg(r,_n.provider,{build:t=>new Ng(t,e.cacheSizeBytes)})}function Kg(r,e,t){if((r=Q(r,oe))._firestoreClient||r._terminated)throw new C(S.FAILED_PRECONDITION,"Firestore has already been started and persistence can no longer be enabled. You can only enable persistence before calling any other methods on a Firestore object.");if(r._componentsProvider||r._getSettings().localCache)throw new C(S.FAILED_PRECONDITION,"SDK cache is already specified.");r._componentsProvider={_online:e,_offline:t},$g(r)}function dA(r){if(r._initialized&&!r._terminated)throw new C(S.FAILED_PRECONDITION,"Persistence can only be cleared before a Firestore instance is initialized or after it is terminated.");const e=new Ne;return r._queue.enqueueAndForgetEvenWhileRestricted(async()=>{try{await async function(n){if(!It.v())return Promise.resolve();const i=n+ig;await It.delete(i)}(Ku(r._databaseId,r._persistenceKey)),e.resolve()}catch(t){e.reject(t)}}),e.promise}function fA(r){return function(t){const n=new Ne;return t.asyncQueue.enqueueAndForget(async()=>Dv(await pl(t),n)),n.promise}(_e(r=Q(r,oe)))}function pA(r){return Wv(_e(r=Q(r,oe)))}function mA(r){return Hv(_e(r=Q(r,oe)))}function gA(r){return lp(r.app,"firestore",r._databaseId.database),r._delete()}function cu(r,e){const t=_e(r=Q(r,oe)),n=new Gg;return Zv(t,r._databaseId,e,n),n}function Wg(r,e){return eA(_e(r=Q(r,oe)),e).then(t=>t?new Pe(r,null,t.query):null)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zr{constructor(e="count",t){this._internalFieldPath=t,this.type="AggregateField",this.aggregateType=e}}class Hg{constructor(e,t,n){this._userDataWriter=t,this._data=n,this.type="AggregateQuerySnapshot",this.query=e}data(){return this._userDataWriter.convertObjectMap(this._data)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ke{constructor(e){this._byteString=e}static fromBase64String(e){try{return new Ke(ye.fromBase64String(e))}catch(t){throw new C(S.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+t)}}static fromUint8Array(e){return new Ke(ye.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:Ke._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(ar(e,Ke._jsonSchema))return Ke.fromBase64String(e.bytes)}}Ke._jsonSchemaVersion="firestore/bytes/1.0",Ke._jsonSchema={type:Re("string",Ke._jsonSchemaVersion),bytes:Re("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class An{constructor(...e){for(let t=0;t<e.length;++t)if(e[t].length===0)throw new C(S.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new he(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}function _A(){return new An(Lc)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rn{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ut{constructor(e,t){if(!isFinite(e)||e<-90||e>90)throw new C(S.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(t)||t<-180||t>180)throw new C(S.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+t);this._lat=e,this._long=t}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return $(this._lat,e._lat)||$(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:ut._jsonSchemaVersion}}static fromJSON(e){if(ar(e,ut._jsonSchema))return new ut(e.latitude,e.longitude)}}ut._jsonSchemaVersion="firestore/geoPoint/1.0",ut._jsonSchema={type:Re("string",ut._jsonSchemaVersion),latitude:Re("number"),longitude:Re("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class it{constructor(e){this._values=(e||[]).map(t=>t)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(n,i){if(n.length!==i.length)return!1;for(let s=0;s<n.length;++s)if(n[s]!==i[s])return!1;return!0}(this._values,e._values)}toJSON(){return{type:it._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(ar(e,it._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(t=>typeof t=="number"))return new it(e.vectorValues);throw new C(S.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}it._jsonSchemaVersion="firestore/vectorValue/1.0",it._jsonSchema={type:Re("string",it._jsonSchemaVersion),vectorValues:Re("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yA=/^__.*__$/;class IA{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return this.fieldMask!==null?new Bt(e,this.data,this.fieldMask,t,this.fieldTransforms):new si(e,this.data,t,this.fieldTransforms)}}class Qg{constructor(e,t,n){this.data=e,this.fieldMask=t,this.fieldTransforms=n}toMutation(e,t){return new Bt(e,this.data,this.fieldMask,t,this.fieldTransforms)}}function Jg(r){switch(r){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw F(40011,{Ac:r})}}class va{constructor(e,t,n,i,s,o){this.settings=e,this.databaseId=t,this.serializer=n,this.ignoreUndefinedProperties=i,s===void 0&&this.Rc(),this.fieldTransforms=s||[],this.fieldMask=o||[]}get path(){return this.settings.path}get Ac(){return this.settings.Ac}Vc(e){return new va({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}mc(e){const t=this.path?.child(e),n=this.Vc({path:t,fc:!1});return n.gc(e),n}yc(e){const t=this.path?.child(e),n=this.Vc({path:t,fc:!1});return n.Rc(),n}wc(e){return this.Vc({path:void 0,fc:!0})}Sc(e){return Ho(e,this.settings.methodName,this.settings.bc||!1,this.path,this.settings.Dc)}contains(e){return this.fieldMask.find(t=>e.isPrefixOf(t))!==void 0||this.fieldTransforms.find(t=>e.isPrefixOf(t.field))!==void 0}Rc(){if(this.path)for(let e=0;e<this.path.length;e++)this.gc(this.path.get(e))}gc(e){if(e.length===0)throw this.Sc("Document fields must not be empty");if(Jg(this.Ac)&&yA.test(e))throw this.Sc('Document fields cannot begin and end with "__"')}}class EA{constructor(e,t,n){this.databaseId=e,this.ignoreUndefinedProperties=t,this.serializer=n||cr(e)}Cc(e,t,n,i=!1){return new va({Ac:e,methodName:t,Dc:n,path:he.emptyPath(),fc:!1,bc:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function ur(r){const e=r._freezeSettings(),t=cr(r._databaseId);return new EA(r._databaseId,!!e.ignoreUndefinedProperties,t)}function Aa(r,e,t,n,i,s={}){const o=r.Cc(s.merge||s.mergeFields?2:0,e,t,i);wl("Data must be an object, but it was:",o,n);const c=Zg(n,o);let u,l;if(s.merge)u=new He(o.fieldMask),l=o.fieldTransforms;else if(s.mergeFields){const f=[];for(const p of s.mergeFields){const g=Ts(e,p,t);if(!o.contains(g))throw new C(S.INVALID_ARGUMENT,`Field '${g}' is specified in your field mask but missing from your input data.`);t_(f,g)||f.push(g)}u=new He(f),l=o.fieldTransforms.filter(p=>u.covers(p.field))}else u=null,l=o.fieldTransforms;return new IA(new Me(c),u,l)}class Fs extends Rn{_toFieldTransform(e){if(e.Ac!==2)throw e.Ac===1?e.Sc(`${this._methodName}() can only appear at the top level of your update data`):e.Sc(`${this._methodName}() cannot be used with set() unless you pass {merge:true}`);return e.fieldMask.push(e.path),null}isEqual(e){return e instanceof Fs}}function Yg(r,e,t){return new va({Ac:3,Dc:e.settings.Dc,methodName:r._methodName,fc:t},e.databaseId,e.serializer,e.ignoreUndefinedProperties)}class gl extends Rn{_toFieldTransform(e){return new Ns(e.path,new Gr)}isEqual(e){return e instanceof gl}}class _l extends Rn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=Yg(this,e,!0),n=this.vc.map(s=>lr(s,t)),i=new Xn(n);return new Ns(e.path,i)}isEqual(e){return e instanceof _l&&lt(this.vc,e.vc)}}class yl extends Rn{constructor(e,t){super(e),this.vc=t}_toFieldTransform(e){const t=Yg(this,e,!0),n=this.vc.map(s=>lr(s,t)),i=new Zn(n);return new Ns(e.path,i)}isEqual(e){return e instanceof yl&&lt(this.vc,e.vc)}}class Il extends Rn{constructor(e,t){super(e),this.Fc=t}_toFieldTransform(e){const t=new $r(e.serializer,Em(e.serializer,this.Fc));return new Ns(e.path,t)}isEqual(e){return e instanceof Il&&this.Fc===e.Fc}}function El(r,e,t,n){const i=r.Cc(1,e,t);wl("Data must be an object, but it was:",i,n);const s=[],o=Me.empty();Tn(n,(u,l)=>{const f=Ra(e,u,t);l=z(l);const p=i.yc(f);if(l instanceof Fs)s.push(f);else{const g=lr(l,p);g!=null&&(s.push(f),o.set(f,g))}});const c=new He(s);return new Qg(o,c,i.fieldTransforms)}function Tl(r,e,t,n,i,s){const o=r.Cc(1,e,t),c=[Ts(e,n,t)],u=[i];if(s.length%2!=0)throw new C(S.INVALID_ARGUMENT,`Function ${e}() needs to be called with an even number of arguments that alternate between field names and values.`);for(let g=0;g<s.length;g+=2)c.push(Ts(e,s[g])),u.push(s[g+1]);const l=[],f=Me.empty();for(let g=c.length-1;g>=0;--g)if(!t_(l,c[g])){const v=c[g];let D=u[g];D=z(D);const k=o.yc(v);if(D instanceof Fs)l.push(v);else{const V=lr(D,k);V!=null&&(l.push(v),f.set(v,V))}}const p=new He(l);return new Qg(f,p,o.fieldTransforms)}function Xg(r,e,t,n=!1){return lr(t,r.Cc(n?4:3,e))}function lr(r,e){if(e_(r=z(r)))return wl("Unsupported field value:",e,r),Zg(r,e);if(r instanceof Rn)return function(n,i){if(!Jg(i.Ac))throw i.Sc(`${n._methodName}() can only be used with update() and set()`);if(!i.path)throw i.Sc(`${n._methodName}() is not currently supported inside arrays`);const s=n._toFieldTransform(i);s&&i.fieldTransforms.push(s)}(r,e),null;if(r===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),r instanceof Array){if(e.settings.fc&&e.Ac!==4)throw e.Sc("Nested arrays are not supported");return function(n,i){const s=[];let o=0;for(const c of n){let u=lr(c,i.wc(o));u==null&&(u={nullValue:"NULL_VALUE"}),s.push(u),o++}return{arrayValue:{values:s}}}(r,e)}return function(n,i){if((n=z(n))===null)return{nullValue:"NULL_VALUE"};if(typeof n=="number")return Em(i.serializer,n);if(typeof n=="boolean")return{booleanValue:n};if(typeof n=="string")return{stringValue:n};if(n instanceof Date){const s=ne.fromDate(n);return{timestampValue:Kr(i.serializer,s)}}if(n instanceof ne){const s=new ne(n.seconds,1e3*Math.floor(n.nanoseconds/1e3));return{timestampValue:Kr(i.serializer,s)}}if(n instanceof ut)return{geoPointValue:{latitude:n.latitude,longitude:n.longitude}};if(n instanceof Ke)return{bytesValue:Nm(i.serializer,n._byteString)};if(n instanceof ie){const s=i.databaseId,o=n.firestore._databaseId;if(!o.isEqual(s))throw i.Sc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${s.projectId}/${s.database}`);return{referenceValue:Bu(n.firestore._databaseId||i.databaseId,n._key.path)}}if(n instanceof it)return function(o,c){return{mapValue:{fields:{[Cu]:{stringValue:Du},[qr]:{arrayValue:{values:o.toArray().map(l=>{if(typeof l!="number")throw c.Sc("VectorValues must only contain numeric values.");return Ou(c.serializer,l)})}}}}}}(n,i);throw i.Sc(`Unsupported field value: ${ra(n)}`)}(r,e)}function Zg(r,e){const t={};return Wp(r)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):Tn(r,(n,i)=>{const s=lr(i,e.mc(n));s!=null&&(t[n]=s)}),{mapValue:{fields:t}}}function e_(r){return!(typeof r!="object"||r===null||r instanceof Array||r instanceof Date||r instanceof ne||r instanceof ut||r instanceof Ke||r instanceof ie||r instanceof Rn||r instanceof it)}function wl(r,e,t){if(!e_(t)||!Pp(t)){const n=ra(t);throw n==="an object"?e.Sc(r+" a custom object"):e.Sc(r+" "+n)}}function Ts(r,e,t){if((e=z(e))instanceof An)return e._internalPath;if(typeof e=="string")return Ra(r,e);throw Ho("Field path arguments must be of type string or ",r,!1,void 0,t)}const TA=new RegExp("[~\\*/\\[\\]]");function Ra(r,e,t){if(e.search(TA)>=0)throw Ho(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,r,!1,void 0,t);try{return new An(...e.split("."))._internalPath}catch{throw Ho(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,r,!1,void 0,t)}}function Ho(r,e,t,n,i){const s=n&&!n.isEmpty(),o=i!==void 0;let c=`Function ${e}() called with invalid data`;t&&(c+=" (via `toFirestore()`)"),c+=". ";let u="";return(s||o)&&(u+=" (found",s&&(u+=` in field ${n}`),o&&(u+=` in document ${i}`),u+=")"),new C(S.INVALID_ARGUMENT,c+r+u)}function t_(r,e){return r.some(t=>t.isEqual(e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ws{constructor(e,t,n,i,s){this._firestore=e,this._userDataWriter=t,this._key=n,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new ie(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new wA(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}get(e){if(this._document){const t=this._document.data.field(Sa("DocumentSnapshot.get",e));if(t!==null)return this._userDataWriter.convertValue(t)}}}class wA extends ws{data(){return super.data()}}function Sa(r,e){return typeof e=="string"?Ra(r,e):e instanceof An?e._internalPath:e._delegate._internalPath}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function n_(r){if(r.limitType==="L"&&r.explicitOrderBy.length===0)throw new C(S.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class vl{}class di extends vl{}function vA(r,e,...t){let n=[];e instanceof vl&&n.push(e),n=n.concat(t),function(s){const o=s.filter(u=>u instanceof hr).length,c=s.filter(u=>u instanceof fi).length;if(o>1||o>0&&c>0)throw new C(S.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(n);for(const i of n)r=i._apply(r);return r}class fi extends di{constructor(e,t,n){super(),this._field=e,this._op=t,this._value=n,this.type="where"}static _create(e,t,n){return new fi(e,t,n)}_apply(e){const t=this._parse(e);return i_(e._query,t),new Pe(e.firestore,e.converter,Hc(e._query,t))}_parse(e){const t=ur(e.firestore);return function(s,o,c,u,l,f,p){let g;if(l.isKeyField()){if(f==="array-contains"||f==="array-contains-any")throw new C(S.INVALID_ARGUMENT,`Invalid Query. You can't perform '${f}' queries on documentId().`);if(f==="in"||f==="not-in"){Rf(p,f);const D=[];for(const k of p)D.push(Af(u,s,k));g={arrayValue:{values:D}}}else g=Af(u,s,p)}else f!=="in"&&f!=="not-in"&&f!=="array-contains-any"||Rf(p,f),g=Xg(c,o,p,f==="in"||f==="not-in");return Y.create(l,f,g)}(e._query,"where",t,e.firestore._databaseId,this._field,this._op,this._value)}}function AA(r,e,t){const n=e,i=Sa("where",r);return fi._create(i,n,t)}class hr extends vl{constructor(e,t){super(),this.type=e,this._queryConstraints=t}static _create(e,t){return new hr(e,t)}_parse(e){const t=this._queryConstraints.map(n=>n._parse(e)).filter(n=>n.getFilters().length>0);return t.length===1?t[0]:re.create(t,this._getOperator())}_apply(e){const t=this._parse(e);return t.getFilters().length===0?e:(function(i,s){let o=i;const c=s.getFlattenedFilters();for(const u of c)i_(o,u),o=Hc(o,u)}(e._query,t),new Pe(e.firestore,e.converter,Hc(e._query,t)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}function RA(...r){return r.forEach(e=>s_("or",e)),hr._create("or",r)}function SA(...r){return r.forEach(e=>s_("and",e)),hr._create("and",r)}class ba extends di{constructor(e,t){super(),this._field=e,this._direction=t,this.type="orderBy"}static _create(e,t){return new ba(e,t)}_apply(e){const t=function(i,s,o){if(i.startAt!==null)throw new C(S.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(i.endAt!==null)throw new C(S.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new ys(s,o)}(e._query,this._field,this._direction);return new Pe(e.firestore,e.converter,function(i,s){const o=i.explicitOrderBy.concat([s]);return new Ft(i.path,i.collectionGroup,o,i.filters.slice(),i.limit,i.limitType,i.startAt,i.endAt)}(e._query,t))}}function bA(r,e="asc"){const t=e,n=Sa("orderBy",r);return ba._create(n,t)}class Us extends di{constructor(e,t,n){super(),this.type=e,this._limit=t,this._limitType=n}static _create(e,t,n){return new Us(e,t,n)}_apply(e){return new Pe(e.firestore,e.converter,Uo(e._query,this._limit,this._limitType))}}function PA(r){return Cp("limit",r),Us._create("limit",r,"F")}function CA(r){return Cp("limitToLast",r),Us._create("limitToLast",r,"L")}class Bs extends di{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new Bs(e,t,n)}_apply(e){const t=r_(e,this.type,this._docOrFields,this._inclusive);return new Pe(e.firestore,e.converter,function(i,s){return new Ft(i.path,i.collectionGroup,i.explicitOrderBy.slice(),i.filters.slice(),i.limit,i.limitType,s,i.endAt)}(e._query,t))}}function DA(...r){return Bs._create("startAt",r,!0)}function kA(...r){return Bs._create("startAfter",r,!1)}class qs extends di{constructor(e,t,n){super(),this.type=e,this._docOrFields=t,this._inclusive=n}static _create(e,t,n){return new qs(e,t,n)}_apply(e){const t=r_(e,this.type,this._docOrFields,this._inclusive);return new Pe(e.firestore,e.converter,function(i,s){return new Ft(i.path,i.collectionGroup,i.explicitOrderBy.slice(),i.filters.slice(),i.limit,i.limitType,i.startAt,s)}(e._query,t))}}function VA(...r){return qs._create("endBefore",r,!1)}function NA(...r){return qs._create("endAt",r,!0)}function r_(r,e,t,n){if(t[0]=z(t[0]),t[0]instanceof ws)return function(s,o,c,u,l){if(!u)throw new C(S.NOT_FOUND,`Can't use a DocumentSnapshot that doesn't exist for ${c}().`);const f=[];for(const p of Sr(s))if(p.field.isKeyField())f.push(Jn(o,u.key));else{const g=u.data.field(p.field);if(ca(g))throw new C(S.INVALID_ARGUMENT,'Invalid query. You are trying to start or end a query using a document for which the field "'+p.field+'" is an uncommitted server timestamp. (Since the value of this field is unknown, you cannot start/end a query with it.)');if(g===null){const v=p.field.canonicalString();throw new C(S.INVALID_ARGUMENT,`Invalid query. You are trying to start or end a query using a document for which the field '${v}' (used as the orderBy) does not exist.`)}f.push(g)}return new mn(f,l)}(r._query,r.firestore._databaseId,e,t[0]._document,n);{const i=ur(r.firestore);return function(o,c,u,l,f,p){const g=o.explicitOrderBy;if(f.length>g.length)throw new C(S.INVALID_ARGUMENT,`Too many arguments provided to ${l}(). The number of arguments must be less than or equal to the number of orderBy() clauses`);const v=[];for(let D=0;D<f.length;D++){const k=f[D];if(g[D].field.isKeyField()){if(typeof k!="string")throw new C(S.INVALID_ARGUMENT,`Invalid query. Expected a string for document ID in ${l}(), but got a ${typeof k}`);if(!Vu(o)&&k.indexOf("/")!==-1)throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection and ordering by documentId(), the value passed to ${l}() must be a plain document ID, but '${k}' contains a slash.`);const V=o.path.child(H.fromString(k));if(!x.isDocumentKey(V))throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group and ordering by documentId(), the value passed to ${l}() must result in a valid document path, but '${V}' is not because it contains an odd number of segments.`);const U=new x(V);v.push(Jn(c,U))}else{const V=Xg(u,l,k);v.push(V)}}return new mn(v,p)}(r._query,r.firestore._databaseId,i,e,t,n)}}function Af(r,e,t){if(typeof(t=z(t))=="string"){if(t==="")throw new C(S.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Vu(e)&&t.indexOf("/")!==-1)throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${t}' contains a '/' character.`);const n=e.path.child(H.fromString(t));if(!x.isDocumentKey(n))throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${n}' is not because it has an odd number of segments (${n.length}).`);return Jn(r,new x(n))}if(t instanceof ie)return Jn(r,t._key);throw new C(S.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${ra(t)}.`)}function Rf(r,e){if(!Array.isArray(r)||r.length===0)throw new C(S.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function i_(r,e){const t=function(i,s){for(const o of i)for(const c of o.getFlattenedFilters())if(s.indexOf(c.op)>=0)return c.op;return null}(r.filters,function(i){switch(i){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(t!==null)throw t===e.op?new C(S.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new C(S.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${t.toString()}' filters.`)}function s_(r,e){if(!(e instanceof fi||e instanceof hr))throw new C(S.INVALID_ARGUMENT,`Function ${r}() requires AppliableConstraints created with a call to 'where(...)', 'or(...)', or 'and(...)'.`)}class Al{convertValue(e,t="none"){switch(fn(e)){case 0:return null;case 1:return e.booleanValue;case 2:return pe(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,t);case 5:return e.stringValue;case 6:return this.convertBytes(xt(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,t);case 11:return this.convertObject(e.mapValue,t);case 10:return this.convertVectorValue(e.mapValue);default:throw F(62114,{value:e})}}convertObject(e,t){return this.convertObjectMap(e.fields,t)}convertObjectMap(e,t="none"){const n={};return Tn(e,(i,s)=>{n[i]=this.convertValue(s,t)}),n}convertVectorValue(e){const t=e.fields?.[qr].arrayValue?.values?.map(n=>pe(n.doubleValue));return new it(t)}convertGeoPoint(e){return new ut(pe(e.latitude),pe(e.longitude))}convertArray(e,t){return(e.values||[]).map(n=>this.convertValue(n,t))}convertServerTimestamp(e,t){switch(t){case"previous":const n=ua(e);return n==null?null:this.convertValue(n,t);case"estimate":return this.convertTimestamp(ps(e));default:return null}}convertTimestamp(e){const t=Ot(e);return new ne(t.seconds,t.nanos)}convertDocumentKey(e,t){const n=H.fromString(e);B(jm(n),9688,{name:e});const i=new dn(n.get(1),n.get(3)),s=new x(n.popFirst(5));return i.isEqual(t)||Te(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${t.projectId}/${t.database}) instead.`),s}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pa(r,e,t){let n;return n=r?t&&(t.merge||t.mergeFields)?r.toFirestore(e,t):r.toFirestore(e):e,n}class Rl extends Al{constructor(e){super(),this.firestore=e}convertBytes(e){return new Ke(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ie(this.firestore,null,t)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function OA(r){return new Zr("sum",Ts("sum",r))}function xA(r){return new Zr("avg",Ts("average",r))}function o_(){return new Zr("count")}function MA(r,e){return r instanceof Zr&&e instanceof Zr&&r.aggregateType===e.aggregateType&&r._internalFieldPath?.canonicalString()===e._internalFieldPath?.canonicalString()}function LA(r,e){return ml(r.query,e.query)&&lt(r.data(),e.data())}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const a_="NOT SUPPORTED";class Ct{constructor(e,t){this.hasPendingWrites=e,this.fromCache=t}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Je extends ws{constructor(e,t,n,i,s,o){super(e,t,n,i,o),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const t=new rs(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(t,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,t={}){if(this._document){const n=this._document.data.field(Sa("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n,t.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new C(S.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,t={};return t.type=Je._jsonSchemaVersion,t.bundle="",t.bundleSource="DocumentSnapshot",t.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?t:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),t.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),t)}}function FA(r,e,t){if(ar(e,Je._jsonSchema)){if(e.bundle===a_)throw new C(S.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const n=cr(r._databaseId),i=Ug(e.bundle,n),s=i.Wu(),o=new sl(i.getMetadata(),n);for(const f of s)o.Ga(f);const c=o.documents;if(c.length!==1)throw new C(S.INVALID_ARGUMENT,`Expected bundle data to contain 1 document, but it contains ${c.length} documents.`);const u=fa(n,c[0].document),l=new x(H.fromString(e.bundleName));return new Je(r,new Rl(r),l,u,new Ct(!1,!1),t||null)}}Je._jsonSchemaVersion="firestore/documentSnapshot/1.0",Je._jsonSchema={type:Re("string",Je._jsonSchemaVersion),bundleSource:Re("string","DocumentSnapshot"),bundleName:Re("string"),bundle:Re("string")};class rs extends Je{data(e={}){return super.data(e)}}class Ye{constructor(e,t,n,i){this._firestore=e,this._userDataWriter=t,this._snapshot=i,this.metadata=new Ct(i.hasPendingWrites,i.fromCache),this.query=n}get docs(){const e=[];return this.forEach(t=>e.push(t)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,t){this._snapshot.docs.forEach(n=>{e.call(t,new rs(this._firestore,this._userDataWriter,n.key,n,new Ct(this._snapshot.mutatedKeys.has(n.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const t=!!e.includeMetadataChanges;if(t&&this._snapshot.excludesMetadataChanges)throw new C(S.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===t||(this._cachedChanges=function(i,s){if(i._snapshot.oldDocs.isEmpty()){let o=0;return i._snapshot.docChanges.map(c=>{const u=new rs(i._firestore,i._userDataWriter,c.doc.key,c.doc,new Ct(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter);return c.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}})}{let o=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(c=>s||c.type!==3).map(c=>{const u=new rs(i._firestore,i._userDataWriter,c.doc.key,c.doc,new Ct(i._snapshot.mutatedKeys.has(c.doc.key),i._snapshot.fromCache),i.query.converter);let l=-1,f=-1;return c.type!==0&&(l=o.indexOf(c.doc.key),o=o.delete(c.doc.key)),c.type!==1&&(o=o.add(c.doc),f=o.indexOf(c.doc.key)),{type:BA(c.type),doc:u,oldIndex:l,newIndex:f}})}}(this,t),this._cachedChangesIncludeMetadataChanges=t),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new C(S.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=Ye._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=na.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const t=[],n=[],i=[];return this.docs.forEach(s=>{s._document!==null&&(t.push(s._document),n.push(this._userDataWriter.convertObjectMap(s._document.data.value.mapValue.fields,"previous")),i.push(s.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function UA(r,e,t){if(ar(e,Ye._jsonSchema)){if(e.bundle===a_)throw new C(S.INVALID_ARGUMENT,"The provided JSON object was created in a client environment, which is not supported.");const n=cr(r._databaseId),i=Ug(e.bundle,n),s=i.Wu(),o=new sl(i.getMetadata(),n);for(const g of s)o.Ga(g);if(o.queries.length!==1)throw new C(S.INVALID_ARGUMENT,`Snapshot data expected 1 query but found ${o.queries.length} queries.`);const c=ma(o.queries[0].bundledQuery),u=o.documents;let l=new Kn;u.map(g=>{const v=fa(n,g.document);l=l.add(v)});const f=ir.fromInitialDocuments(c,l,K(),!1,!1),p=new Pe(r,t||null,c);return new Ye(r,new Rl(r),p,f)}}function BA(r){switch(r){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return F(61501,{type:r})}}function qA(r,e){return r instanceof Je&&e instanceof Je?r._firestore===e._firestore&&r._key.isEqual(e._key)&&(r._document===null?e._document===null:r._document.isEqual(e._document))&&r._converter===e._converter:r instanceof Ye&&e instanceof Ye&&r._firestore===e._firestore&&ml(r.query,e.query)&&r.metadata.isEqual(e.metadata)&&r._snapshot.isEqual(e._snapshot)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function zA(r){r=Q(r,ie);const e=Q(r.firestore,oe);return Lg(_e(e),r._key).then(t=>Sl(e,r,t))}Ye._jsonSchemaVersion="firestore/querySnapshot/1.0",Ye._jsonSchema={type:Re("string",Ye._jsonSchemaVersion),bundleSource:Re("string","QuerySnapshot"),bundleName:Re("string"),bundle:Re("string")};class Sn extends Al{constructor(e){super(),this.firestore=e}convertBytes(e){return new Ke(e)}convertReference(e){const t=this.convertDocumentKey(e,this.firestore._databaseId);return new ie(this.firestore,null,t)}}function jA(r){r=Q(r,ie);const e=Q(r.firestore,oe),t=_e(e),n=new Sn(e);return Qv(t,r._key).then(i=>new Je(e,n,r._key,i,new Ct(i!==null&&i.hasLocalMutations,!0),r.converter))}function GA(r){r=Q(r,ie);const e=Q(r.firestore,oe);return Lg(_e(e),r._key,{source:"server"}).then(t=>Sl(e,r,t))}function $A(r){r=Q(r,Pe);const e=Q(r.firestore,oe),t=_e(e),n=new Sn(e);return n_(r._query),Fg(t,r._query).then(i=>new Ye(e,n,r,i))}function KA(r){r=Q(r,Pe);const e=Q(r.firestore,oe),t=_e(e),n=new Sn(e);return Jv(t,r._query).then(i=>new Ye(e,n,r,i))}function WA(r){r=Q(r,Pe);const e=Q(r.firestore,oe),t=_e(e),n=new Sn(e);return Fg(t,r._query,{source:"server"}).then(i=>new Ye(e,n,r,i))}function HA(r,e,t){r=Q(r,ie);const n=Q(r.firestore,oe),i=Pa(r.converter,e,t);return pi(n,[Aa(ur(n),"setDoc",r._key,i,r.converter!==null,t).toMutation(r._key,ge.none())])}function QA(r,e,t,...n){r=Q(r,ie);const i=Q(r.firestore,oe),s=ur(i);let o;return o=typeof(e=z(e))=="string"||e instanceof An?Tl(s,"updateDoc",r._key,e,t,n):El(s,"updateDoc",r._key,e),pi(i,[o.toMutation(r._key,ge.exists(!0))])}function JA(r){return pi(Q(r.firestore,oe),[new oi(r._key,ge.none())])}function YA(r,e){const t=Q(r.firestore,oe),n=jg(r),i=Pa(r.converter,e);return pi(t,[Aa(ur(r.firestore),"addDoc",n._key,i,r.converter!==null,{}).toMutation(n._key,ge.exists(!1))]).then(()=>n)}function uu(r,...e){r=z(r);let t={includeMetadataChanges:!1,source:"default"},n=0;typeof e[n]!="object"||br(e[n])||(t=e[n++]);const i={includeMetadataChanges:t.includeMetadataChanges,source:t.source};if(br(e[n])){const u=e[n];e[n]=u.next?.bind(u),e[n+1]=u.error?.bind(u),e[n+2]=u.complete?.bind(u)}let s,o,c;if(r instanceof ie)o=Q(r.firestore,oe),c=ii(r._key.path),s={next:u=>{e[n]&&e[n](Sl(o,r,u))},error:e[n+1],complete:e[n+2]};else{const u=Q(r,Pe);o=Q(u.firestore,oe),c=u._query;const l=new Sn(o);s={next:f=>{e[n]&&e[n](new Ye(o,l,u,f))},error:e[n+1],complete:e[n+2]},n_(r._query)}return function(l,f,p,g){const v=new Ta(g),D=new il(f,v,p);return l.asyncQueue.enqueueAndForget(async()=>tl(await Xr(l),D)),()=>{v.Nu(),l.asyncQueue.enqueueAndForget(async()=>nl(await Xr(l),D))}}(_e(o),c,i,s)}function XA(r,e,...t){const n=z(r),i=function(u){const l={bundle:"",bundleName:"",bundleSource:""},f=["bundle","bundleName","bundleSource"];for(const p of f){if(!(p in u)){l.error=`snapshotJson missing required field: ${p}`;break}const g=u[p];if(typeof g!="string"){l.error=`snapshotJson field '${p}' must be a string.`;break}if(g.length===0){l.error=`snapshotJson field '${p}' cannot be an empty string.`;break}p==="bundle"?l.bundle=g:p==="bundleName"?l.bundleName=g:p==="bundleSource"&&(l.bundleSource=g)}return l}(e);if(i.error)throw new C(S.INVALID_ARGUMENT,i.error);let s,o=0;if(typeof t[o]!="object"||br(t[o])||(s=t[o++]),i.bundleSource==="QuerySnapshot"){let c=null;if(typeof t[o]=="object"&&br(t[o])){const u=t[o++];c={next:u.next,error:u.error,complete:u.complete}}else c={next:t[o++],error:t[o++],complete:t[o++]};return function(l,f,p,g,v){let D,k=!1;return cu(l,f.bundle).then(()=>Wg(l,f.bundleName)).then(U=>{U&&!k&&(v&&U.withConverter(v),D=uu(U,p||{},g))}).catch(U=>(g.error&&g.error(U),()=>{})),()=>{k||(k=!0,D&&D())}}(n,i,s,c,t[o])}if(i.bundleSource==="DocumentSnapshot"){let c=null;if(typeof t[o]=="object"&&br(t[o])){const u=t[o++];c={next:u.next,error:u.error,complete:u.complete}}else c={next:t[o++],error:t[o++],complete:t[o++]};return function(l,f,p,g,v){let D,k=!1;return cu(l,f.bundle).then(()=>{if(!k){const U=new ie(l,v||null,x.fromPath(f.bundleName));D=uu(U,p||{},g)}}).catch(U=>(g.error&&g.error(U),()=>{})),()=>{k||(k=!0,D&&D())}}(n,i,s,c,t[o])}throw new C(S.INVALID_ARGUMENT,`unsupported bundle source: ${i.bundleSource}`)}function ZA(r,e){return Xv(_e(r=Q(r,oe)),br(e)?e:{next:e})}function pi(r,e){return function(n,i){const s=new Ne;return n.asyncQueue.enqueueAndForget(async()=>Sv(await pl(n),i,s)),s.promise}(_e(r),e)}function Sl(r,e,t){const n=t.docs.get(e._key),i=new Sn(r);return new Je(r,i,e._key,n,new Ct(t.hasPendingWrites,t.fromCache),e.converter)}function eR(r){return c_(r,{count:o_()})}function c_(r,e){const t=Q(r.firestore,oe),n=_e(t),i=Kp(e,(s,o)=>new bm(o,s.aggregateType,s._internalFieldPath));return Yv(n,r._query,i).then(s=>function(c,u,l){const f=new Sn(c);return new Hg(u,f,l)}(t,r,s))}class tR{constructor(e){this.kind="memory",this._onlineComponentProvider=_n.provider,this._offlineComponentProvider=e?.garbageCollector?e.garbageCollector._offlineComponentProvider:{build:()=>new hl(void 0)}}toJSON(){return{kind:this.kind}}}class nR{constructor(e){let t;this.kind="persistent",e?.tabManager?(e.tabManager._initialize(e),t=e.tabManager):(t=u_(void 0),t._initialize(e)),this._onlineComponentProvider=t._onlineComponentProvider,this._offlineComponentProvider=t._offlineComponentProvider}toJSON(){return{kind:this.kind}}}class rR{constructor(){this.kind="memoryEager",this._offlineComponentProvider=Yr.provider}toJSON(){return{kind:this.kind}}}class iR{constructor(e){this.kind="memoryLru",this._offlineComponentProvider={build:()=>new hl(e)}}toJSON(){return{kind:this.kind}}}function sR(){return new rR}function oR(r){return new iR(r?.cacheSizeBytes)}function aR(r){return new tR(r)}function cR(r){return new nR(r)}class uR{constructor(e){this.forceOwnership=e,this.kind="persistentSingleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=_n.provider,this._offlineComponentProvider={build:t=>new dl(t,e?.cacheSizeBytes,this.forceOwnership)}}}class lR{constructor(){this.kind="PersistentMultipleTab"}toJSON(){return{kind:this.kind}}_initialize(e){this._onlineComponentProvider=_n.provider,this._offlineComponentProvider={build:t=>new Ng(t,e?.cacheSizeBytes)}}}function u_(r){return new uR(r?.forceOwnership)}function hR(){return new lR}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dR={maxAttempts:5};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class l_{constructor(e,t){this._firestore=e,this._commitHandler=t,this._mutations=[],this._committed=!1,this._dataReader=ur(e)}set(e,t,n){this._verifyNotCommitted();const i=rn(e,this._firestore),s=Pa(i.converter,t,n),o=Aa(this._dataReader,"WriteBatch.set",i._key,s,i.converter!==null,n);return this._mutations.push(o.toMutation(i._key,ge.none())),this}update(e,t,n,...i){this._verifyNotCommitted();const s=rn(e,this._firestore);let o;return o=typeof(t=z(t))=="string"||t instanceof An?Tl(this._dataReader,"WriteBatch.update",s._key,t,n,i):El(this._dataReader,"WriteBatch.update",s._key,t),this._mutations.push(o.toMutation(s._key,ge.exists(!0))),this}delete(e){this._verifyNotCommitted();const t=rn(e,this._firestore);return this._mutations=this._mutations.concat(new oi(t._key,ge.none())),this}commit(){return this._verifyNotCommitted(),this._committed=!0,this._mutations.length>0?this._commitHandler(this._mutations):Promise.resolve()}_verifyNotCommitted(){if(this._committed)throw new C(S.FAILED_PRECONDITION,"A write batch can no longer be used after commit() has been called.")}}function rn(r,e){if((r=z(r)).firestore!==e)throw new C(S.INVALID_ARGUMENT,"Provided document reference is from a different Firestore instance.");return r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fR{constructor(e,t){this._firestore=e,this._transaction=t,this._dataReader=ur(e)}get(e){const t=rn(e,this._firestore),n=new Rl(this._firestore);return this._transaction.lookup([t._key]).then(i=>{if(!i||i.length!==1)return F(24041);const s=i[0];if(s.isFoundDocument())return new ws(this._firestore,n,s.key,s,t.converter);if(s.isNoDocument())return new ws(this._firestore,n,t._key,null,t.converter);throw F(18433,{doc:s})})}set(e,t,n){const i=rn(e,this._firestore),s=Pa(i.converter,t,n),o=Aa(this._dataReader,"Transaction.set",i._key,s,i.converter!==null,n);return this._transaction.set(i._key,o),this}update(e,t,n,...i){const s=rn(e,this._firestore);let o;return o=typeof(t=z(t))=="string"||t instanceof An?Tl(this._dataReader,"Transaction.update",s._key,t,n,i):El(this._dataReader,"Transaction.update",s._key,t),this._transaction.update(s._key,o),this}delete(e){const t=rn(e,this._firestore);return this._transaction.delete(t._key),this}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class h_ extends fR{constructor(e,t){super(e,t),this._firestore=e}get(e){const t=rn(e,this._firestore),n=new Sn(this._firestore);return super.get(e).then(i=>new Je(this._firestore,n,t._key,i._document,new Ct(!1,!1),t.converter))}}function pR(r,e,t){r=Q(r,oe);const n={...dR,...t};return function(s){if(s.maxAttempts<1)throw new C(S.INVALID_ARGUMENT,"Max attempts must be at least 1")}(n),function(s,o,c){const u=new Ne;return s.asyncQueue.enqueueAndForget(async()=>{const l=await Mg(s);new $v(s.asyncQueue,l,c,o,u).ju()}),u.promise}(_e(r),i=>e(new h_(r,i)),n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function mR(){return new Fs("deleteField")}function gR(){return new gl("serverTimestamp")}function _R(...r){return new _l("arrayUnion",r)}function yR(...r){return new yl("arrayRemove",r)}function IR(r){return new Il("increment",r)}function ER(r){return new it(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function TR(r){return _e(r=Q(r,oe)),new l_(r,e=>pi(r,e))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wR(r,e){const t=_e(r=Q(r,oe));if(!t._uninitializedComponentsProvider||t._uninitializedComponentsProvider._offline.kind==="memory")return nt("Cannot enable indexes when persistence is disabled"),Promise.resolve();const n=function(s){const o=typeof s=="string"?function(l){try{return JSON.parse(l)}catch(f){throw new C(S.INVALID_ARGUMENT,"Failed to parse JSON: "+f?.message)}}(s):s,c=[];if(Array.isArray(o.indexes))for(const u of o.indexes){const l=Sf(u,"collectionGroup"),f=[];if(Array.isArray(u.fields))for(const p of u.fields){const g=Ra("setIndexConfiguration",Sf(p,"fieldPath"));p.arrayConfig==="CONTAINS"?f.push(new Gn(g,2)):p.order==="ASCENDING"?f.push(new Gn(g,0)):p.order==="DESCENDING"&&f.push(new Gn(g,1))}c.push(new xr(xr.UNKNOWN_ID,l,f,Mr.empty()))}return c}(e);return tA(t,n)}function Sf(r,e){if(typeof r[e]!="string")throw new C(S.INVALID_ARGUMENT,"Missing string value for: "+e);return r[e]}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class d_{constructor(e){this._firestore=e,this.type="PersistentCacheIndexManager"}}function vR(r){r=Q(r,oe);const e=bf.get(r);if(e)return e;if(_e(r)._uninitializedComponentsProvider?._offline.kind!=="persistent")return null;const n=new d_(r);return bf.set(r,n),n}function AR(r){f_(r,!0)}function RR(r){f_(r,!1)}function SR(r){rA(_e(r._firestore)).then(e=>N("deleting all persistent cache indexes succeeded")).catch(e=>nt("deleting all persistent cache indexes failed",e))}function f_(r,e){nA(_e(r._firestore),e).then(t=>N(`setting persistent cache index auto creation isEnabled=${e} succeeded`)).catch(t=>nt(`setting persistent cache index auto creation isEnabled=${e} failed`,t))}const bf=new WeakMap;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bR(r){const e=_e(Q(r.firestore,oe)),t=e._onlineComponents?.datastore.serializer;return t===void 0?null:pa(t,qe(r._query)).ft}function PR(r,e){const t=Kp(e,(s,o)=>new bm(o,s.aggregateType,s._internalFieldPath)),n=_e(Q(r.firestore,oe)),i=n._onlineComponents?.datastore.serializer;return i===void 0?null:Um(i,hm(r._query),t,!0).request}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class CR{constructor(){throw new Error("instances of this class should not be created")}static onExistenceFilterMismatch(e){return bl.instance.onExistenceFilterMismatch(e)}}class bl{constructor(){this.Mc=new Map}static get instance(){return mo||(mo=new bl,function(t){if(Qc)throw new Error("a TestingHooksSpi instance is already set");Qc=t}(mo)),mo}lt(e){this.Mc.forEach(t=>t(e))}onExistenceFilterMismatch(e){const t=Symbol(),n=this.Mc;return n.set(t,e),()=>n.delete(t)}}let mo=null;(function(e,t=!0){(function(i){ri=i})(or),Qn(new Hn("firestore",(n,{instanceIdentifier:i,options:s})=>{const o=n.getProvider("app").getImmediate(),c=new oe(new qE(n.getProvider("auth-internal")),new GE(o,n.getProvider("app-check-internal")),function(l,f){if(!Object.prototype.hasOwnProperty.apply(l.options,["projectId"]))throw new C(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new dn(l.options.projectId,f)}(o,i),o);return s={useFetchStreams:t,...s},c._setSettings(s),c},"PUBLIC").setMultipleInstances(!0)),yt(id,sd,e),yt(id,sd,"esm2020")})();const uC=Object.freeze(Object.defineProperty({__proto__:null,AbstractUserDataWriter:Al,AggregateField:Zr,AggregateQuerySnapshot:Hg,Bytes:Ke,CACHE_SIZE_UNLIMITED:aA,CollectionReference:ct,DocumentReference:ie,DocumentSnapshot:Je,FieldPath:An,FieldValue:Rn,Firestore:oe,FirestoreError:C,GeoPoint:ut,LoadBundleTask:Gg,PersistentCacheIndexManager:d_,Query:Pe,QueryCompositeFilterConstraint:hr,QueryConstraint:di,QueryDocumentSnapshot:rs,QueryEndAtConstraint:qs,QueryFieldFilterConstraint:fi,QueryLimitConstraint:Us,QueryOrderByConstraint:ba,QuerySnapshot:Ye,QueryStartAtConstraint:Bs,SnapshotMetadata:Ct,Timestamp:ne,Transaction:h_,VectorValue:it,WriteBatch:l_,_AutoId:na,_ByteString:ye,_DatabaseId:dn,_DocumentKey:x,_EmptyAppCheckTokenProvider:$E,_EmptyAuthCredentialsProvider:Rp,_FieldPath:he,_TestingHooks:CR,_cast:Q,_debugAssert:UE,_internalAggregationQueryToProtoRunAggregationQueryRequest:PR,_internalQueryToProtoQueryTarget:bR,_isBase64Available:PT,_logWarn:nt,_validateIsNotUsedTogether:bp,addDoc:YA,aggregateFieldEqual:MA,aggregateQuerySnapshotEqual:LA,and:SA,arrayRemove:yR,arrayUnion:_R,average:xA,clearIndexedDbPersistence:dA,collection:iA,collectionGroup:sA,connectFirestoreEmulator:zg,count:o_,deleteAllPersistentCacheIndexes:SR,deleteDoc:JA,deleteField:mR,disableNetwork:mA,disablePersistentCacheIndexAutoCreation:RR,doc:jg,documentId:_A,documentSnapshotFromJSON:FA,enableIndexedDbPersistence:lA,enableMultiTabIndexedDbPersistence:hA,enableNetwork:pA,enablePersistentCacheIndexAutoCreation:AR,endAt:NA,endBefore:VA,ensureFirestoreConfigured:_e,executeWrite:pi,getAggregateFromServer:c_,getCountFromServer:eR,getDoc:zA,getDocFromCache:jA,getDocFromServer:GA,getDocs:$A,getDocsFromCache:KA,getDocsFromServer:WA,getFirestore:uA,getPersistentCacheIndexManager:vR,increment:IR,initializeFirestore:cA,limit:PA,limitToLast:CA,loadBundle:cu,memoryEagerGarbageCollector:sR,memoryLocalCache:aR,memoryLruGarbageCollector:oR,namedQuery:Wg,onSnapshot:uu,onSnapshotResume:XA,onSnapshotsInSync:ZA,or:RA,orderBy:bA,persistentLocalCache:cR,persistentMultipleTabManager:hR,persistentSingleTabManager:u_,query:vA,queryEqual:ml,querySnapshotFromJSON:UA,refEqual:oA,runTransaction:pR,serverTimestamp:gR,setDoc:HA,setIndexConfiguration:wR,setLogLevel:FE,snapshotEqual:qA,startAfter:kA,startAt:DA,sum:OA,terminate:gA,updateDoc:QA,vector:ER,waitForPendingWrites:fA,where:AA,writeBatch:TR},Symbol.toStringTag,{value:"Module"}));/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const DR={PHONE:"phone",TOTP:"totp"},kR={FACEBOOK:"facebook.com",GITHUB:"github.com",GOOGLE:"google.com",PASSWORD:"password",PHONE:"phone",TWITTER:"twitter.com"},VR={EMAIL_LINK:"emailLink",EMAIL_PASSWORD:"password",FACEBOOK:"facebook.com",GITHUB:"github.com",GOOGLE:"google.com",PHONE:"phone",TWITTER:"twitter.com"},NR={LINK:"link",REAUTHENTICATE:"reauthenticate",SIGN_IN:"signIn"},OR={EMAIL_SIGNIN:"EMAIL_SIGNIN",PASSWORD_RESET:"PASSWORD_RESET",RECOVER_EMAIL:"RECOVER_EMAIL",REVERT_SECOND_FACTOR_ADDITION:"REVERT_SECOND_FACTOR_ADDITION",VERIFY_AND_CHANGE_EMAIL:"VERIFY_AND_CHANGE_EMAIL",VERIFY_EMAIL:"VERIFY_EMAIL"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xR(){return{"admin-restricted-operation":"This operation is restricted to administrators only.","argument-error":"","app-not-authorized":"This app, identified by the domain where it's hosted, is not authorized to use Firebase Authentication with the provided API key. Review your key configuration in the Google API console.","app-not-installed":"The requested mobile application corresponding to the identifier (Android package name or iOS bundle ID) provided is not installed on this device.","captcha-check-failed":"The reCAPTCHA response token provided is either invalid, expired, already used or the domain associated with it does not match the list of whitelisted domains.","code-expired":"The SMS code has expired. Please re-send the verification code to try again.","cordova-not-ready":"Cordova framework is not ready.","cors-unsupported":"This browser is not supported.","credential-already-in-use":"This credential is already associated with a different user account.","custom-token-mismatch":"The custom token corresponds to a different audience.","requires-recent-login":"This operation is sensitive and requires recent authentication. Log in again before retrying this request.","dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK.","dynamic-link-not-activated":"Please activate Dynamic Links in the Firebase Console and agree to the terms and conditions.","email-change-needs-verification":"Multi-factor users must always have a verified email.","email-already-in-use":"The email address is already in use by another account.","emulator-config-failed":'Auth instance has already been used to make a network call. Auth can no longer be configured to use the emulator. Try calling "connectAuthEmulator()" sooner.',"expired-action-code":"The action code has expired.","cancelled-popup-request":"This operation has been cancelled due to another conflicting popup being opened.","internal-error":"An internal AuthError has occurred.","invalid-app-credential":"The phone verification request contains an invalid application verifier. The reCAPTCHA token response is either invalid or expired.","invalid-app-id":"The mobile app identifier is not registered for the current project.","invalid-user-token":"This user's credential isn't valid for this project. This can happen if the user's token has been tampered with, or if the user isn't for the project associated with this API key.","invalid-auth-event":"An internal AuthError has occurred.","invalid-verification-code":"The SMS verification code used to create the phone auth credential is invalid. Please resend the verification code sms and be sure to use the verification code provided by the user.","invalid-continue-uri":"The continue URL provided in the request is invalid.","invalid-cordova-configuration":"The following Cordova plugins must be installed to enable OAuth sign-in: cordova-plugin-buildinfo, cordova-universal-links-plugin, cordova-plugin-browsertab, cordova-plugin-inappbrowser and cordova-plugin-customurlscheme.","invalid-custom-token":"The custom token format is incorrect. Please check the documentation.","invalid-dynamic-link-domain":"The provided dynamic link domain is not configured or authorized for the current project.","invalid-email":"The email address is badly formatted.","invalid-emulator-scheme":"Emulator URL must start with a valid scheme (http:// or https://).","invalid-api-key":"Your API key is invalid, please check you have copied it correctly.","invalid-cert-hash":"The SHA-1 certificate hash provided is invalid.","invalid-credential":"The supplied auth credential is incorrect, malformed or has expired.","invalid-message-payload":"The email template corresponding to this action contains invalid characters in its message. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-multi-factor-session":"The request does not contain a valid proof of first factor successful sign-in.","invalid-oauth-provider":"EmailAuthProvider is not supported for this operation. This operation only supports OAuth providers.","invalid-oauth-client-id":"The OAuth client ID provided is either invalid or does not match the specified API key.","unauthorized-domain":"This domain is not authorized for OAuth operations for your Firebase project. Edit the list of authorized domains from the Firebase console.","invalid-action-code":"The action code is invalid. This can happen if the code is malformed, expired, or has already been used.","wrong-password":"The password is invalid or the user does not have a password.","invalid-persistence-type":"The specified persistence type is invalid. It can only be local, session or none.","invalid-phone-number":"The format of the phone number provided is incorrect. Please enter the phone number in a format that can be parsed into E.164 format. E.164 phone numbers are written in the format [+][country code][subscriber number including area code].","invalid-provider-id":"The specified provider ID is invalid.","invalid-recipient-email":"The email corresponding to this action failed to send as the provided recipient email address is invalid.","invalid-sender":"The email template corresponding to this action contains an invalid sender email or name. Please fix by going to the Auth email templates section in the Firebase Console.","invalid-verification-id":"The verification ID used to create the phone auth credential is invalid.","invalid-tenant-id":"The Auth instance's tenant ID is invalid.","login-blocked":"Login blocked by user-provided method: {$originalMessage}","missing-android-pkg-name":"An Android Package Name must be provided if the Android App is required to be installed.","auth-domain-config-required":"Be sure to include authDomain when calling firebase.initializeApp(), by following the instructions in the Firebase console.","missing-app-credential":"The phone verification request is missing an application verifier assertion. A reCAPTCHA response token needs to be provided.","missing-verification-code":"The phone auth credential was created with an empty SMS verification code.","missing-continue-uri":"A continue URL must be provided in the request.","missing-iframe-start":"An internal AuthError has occurred.","missing-ios-bundle-id":"An iOS Bundle ID must be provided if an App Store ID is provided.","missing-or-invalid-nonce":"The request does not contain a valid nonce. This can occur if the SHA-256 hash of the provided raw nonce does not match the hashed nonce in the ID token payload.","missing-password":"A non-empty password must be provided","missing-multi-factor-info":"No second factor identifier is provided.","missing-multi-factor-session":"The request is missing proof of first factor successful sign-in.","missing-phone-number":"To send verification codes, provide a phone number for the recipient.","missing-verification-id":"The phone auth credential was created with an empty verification ID.","app-deleted":"This instance of FirebaseApp has been deleted.","multi-factor-info-not-found":"The user does not have a second factor matching the identifier provided.","multi-factor-auth-required":"Proof of ownership of a second factor is required to complete sign-in.","account-exists-with-different-credential":"An account already exists with the same email address but different sign-in credentials. Sign in using a provider associated with this email address.","network-request-failed":"A network AuthError (such as timeout, interrupted connection or unreachable host) has occurred.","no-auth-event":"An internal AuthError has occurred.","no-such-provider":"User was not linked to an account with the given provider.","null-user":"A null user object was provided as the argument for an operation which requires a non-null user object.","operation-not-allowed":"The given sign-in provider is disabled for this Firebase project. Enable it in the Firebase console, under the sign-in method tab of the Auth section.","operation-not-supported-in-this-environment":'This operation is not supported in the environment this application is running on. "location.protocol" must be http, https or chrome-extension and web storage must be enabled.',"popup-blocked":"Unable to establish a connection with the popup. It may have been blocked by the browser.","popup-closed-by-user":"The popup has been closed by the user before finalizing the operation.","provider-already-linked":"User can only be linked to one identity for the given provider.","quota-exceeded":"The project's quota for this operation has been exceeded.","redirect-cancelled-by-user":"The redirect operation has been cancelled by the user before finalizing.","redirect-operation-pending":"A redirect sign-in operation is already pending.","rejected-credential":"The request contains malformed or mismatching credentials.","second-factor-already-in-use":"The second factor is already enrolled on this account.","maximum-second-factor-count-exceeded":"The maximum allowed number of second factors on a user has been exceeded.","tenant-id-mismatch":"The provided tenant ID does not match the Auth instance's tenant ID",timeout:"The operation has timed out.","user-token-expired":"The user's credential is no longer valid. The user must sign in again.","too-many-requests":"We have blocked all requests from this device due to unusual activity. Try again later.","unauthorized-continue-uri":"The domain of the continue URL is not whitelisted.  Please whitelist the domain in the Firebase console.","unsupported-first-factor":"Enrolling a second factor or signing in with a multi-factor account requires sign-in with a supported first factor.","unsupported-persistence-type":"The current environment does not support the specified persistence type.","unsupported-tenant-operation":"This operation is not supported in a multi-tenant context.","unverified-email":"The operation requires a verified email.","user-cancelled":"The user did not grant your application the permissions it requested.","user-not-found":"There is no user record corresponding to this identifier. The user may have been deleted.","user-disabled":"The user account has been disabled by an administrator.","user-mismatch":"The supplied credentials do not correspond to the previously signed in user.","user-signed-out":"","weak-password":"The password must be 6 characters long or more.","web-storage-unsupported":"This browser is not supported or 3rd party cookies and data may be disabled.","already-initialized":"initializeAuth() has already been called with different options. To avoid this error, call initializeAuth() with the same options as when it was originally called, or call getAuth() to return the already initialized instance.","missing-recaptcha-token":"The reCAPTCHA token is missing when sending request to the backend.","invalid-recaptcha-token":"The reCAPTCHA token is invalid when sending request to the backend.","invalid-recaptcha-action":"The reCAPTCHA action is invalid when sending request to the backend.","recaptcha-not-enabled":"reCAPTCHA Enterprise integration is not enabled for this project.","missing-client-type":"The reCAPTCHA client type is missing when sending request to the backend.","missing-recaptcha-version":"The reCAPTCHA version is missing when sending request to the backend.","invalid-req-type":"Invalid request parameters.","invalid-recaptcha-version":"The reCAPTCHA version is invalid when sending request to the backend.","unsupported-password-policy-schema-version":"The password policy received from the backend uses a schema version that is not supported by this version of the Firebase SDK.","password-does-not-meet-requirements":"The password does not meet the requirements.","invalid-hosting-link-domain":"The provided Hosting link domain is not configured in Firebase Hosting or is not owned by the current project. This cannot be a default Hosting domain (`web.app` or `firebaseapp.com`)."}}function p_(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const MR=xR,m_=p_,g_=new bs("auth","Firebase",p_()),LR={ADMIN_ONLY_OPERATION:"auth/admin-restricted-operation",ARGUMENT_ERROR:"auth/argument-error",APP_NOT_AUTHORIZED:"auth/app-not-authorized",APP_NOT_INSTALLED:"auth/app-not-installed",CAPTCHA_CHECK_FAILED:"auth/captcha-check-failed",CODE_EXPIRED:"auth/code-expired",CORDOVA_NOT_READY:"auth/cordova-not-ready",CORS_UNSUPPORTED:"auth/cors-unsupported",CREDENTIAL_ALREADY_IN_USE:"auth/credential-already-in-use",CREDENTIAL_MISMATCH:"auth/custom-token-mismatch",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"auth/requires-recent-login",DEPENDENT_SDK_INIT_BEFORE_AUTH:"auth/dependent-sdk-initialized-before-auth",DYNAMIC_LINK_NOT_ACTIVATED:"auth/dynamic-link-not-activated",EMAIL_CHANGE_NEEDS_VERIFICATION:"auth/email-change-needs-verification",EMAIL_EXISTS:"auth/email-already-in-use",EMULATOR_CONFIG_FAILED:"auth/emulator-config-failed",EXPIRED_OOB_CODE:"auth/expired-action-code",EXPIRED_POPUP_REQUEST:"auth/cancelled-popup-request",INTERNAL_ERROR:"auth/internal-error",INVALID_API_KEY:"auth/invalid-api-key",INVALID_APP_CREDENTIAL:"auth/invalid-app-credential",INVALID_APP_ID:"auth/invalid-app-id",INVALID_AUTH:"auth/invalid-user-token",INVALID_AUTH_EVENT:"auth/invalid-auth-event",INVALID_CERT_HASH:"auth/invalid-cert-hash",INVALID_CODE:"auth/invalid-verification-code",INVALID_CONTINUE_URI:"auth/invalid-continue-uri",INVALID_CORDOVA_CONFIGURATION:"auth/invalid-cordova-configuration",INVALID_CUSTOM_TOKEN:"auth/invalid-custom-token",INVALID_DYNAMIC_LINK_DOMAIN:"auth/invalid-dynamic-link-domain",INVALID_EMAIL:"auth/invalid-email",INVALID_EMULATOR_SCHEME:"auth/invalid-emulator-scheme",INVALID_IDP_RESPONSE:"auth/invalid-credential",INVALID_LOGIN_CREDENTIALS:"auth/invalid-credential",INVALID_MESSAGE_PAYLOAD:"auth/invalid-message-payload",INVALID_MFA_SESSION:"auth/invalid-multi-factor-session",INVALID_OAUTH_CLIENT_ID:"auth/invalid-oauth-client-id",INVALID_OAUTH_PROVIDER:"auth/invalid-oauth-provider",INVALID_OOB_CODE:"auth/invalid-action-code",INVALID_ORIGIN:"auth/unauthorized-domain",INVALID_PASSWORD:"auth/wrong-password",INVALID_PERSISTENCE:"auth/invalid-persistence-type",INVALID_PHONE_NUMBER:"auth/invalid-phone-number",INVALID_PROVIDER_ID:"auth/invalid-provider-id",INVALID_RECIPIENT_EMAIL:"auth/invalid-recipient-email",INVALID_SENDER:"auth/invalid-sender",INVALID_SESSION_INFO:"auth/invalid-verification-id",INVALID_TENANT_ID:"auth/invalid-tenant-id",MFA_INFO_NOT_FOUND:"auth/multi-factor-info-not-found",MFA_REQUIRED:"auth/multi-factor-auth-required",MISSING_ANDROID_PACKAGE_NAME:"auth/missing-android-pkg-name",MISSING_APP_CREDENTIAL:"auth/missing-app-credential",MISSING_AUTH_DOMAIN:"auth/auth-domain-config-required",MISSING_CODE:"auth/missing-verification-code",MISSING_CONTINUE_URI:"auth/missing-continue-uri",MISSING_IFRAME_START:"auth/missing-iframe-start",MISSING_IOS_BUNDLE_ID:"auth/missing-ios-bundle-id",MISSING_OR_INVALID_NONCE:"auth/missing-or-invalid-nonce",MISSING_MFA_INFO:"auth/missing-multi-factor-info",MISSING_MFA_SESSION:"auth/missing-multi-factor-session",MISSING_PHONE_NUMBER:"auth/missing-phone-number",MISSING_SESSION_INFO:"auth/missing-verification-id",MODULE_DESTROYED:"auth/app-deleted",NEED_CONFIRMATION:"auth/account-exists-with-different-credential",NETWORK_REQUEST_FAILED:"auth/network-request-failed",NULL_USER:"auth/null-user",NO_AUTH_EVENT:"auth/no-auth-event",NO_SUCH_PROVIDER:"auth/no-such-provider",OPERATION_NOT_ALLOWED:"auth/operation-not-allowed",OPERATION_NOT_SUPPORTED:"auth/operation-not-supported-in-this-environment",POPUP_BLOCKED:"auth/popup-blocked",POPUP_CLOSED_BY_USER:"auth/popup-closed-by-user",PROVIDER_ALREADY_LINKED:"auth/provider-already-linked",QUOTA_EXCEEDED:"auth/quota-exceeded",REDIRECT_CANCELLED_BY_USER:"auth/redirect-cancelled-by-user",REDIRECT_OPERATION_PENDING:"auth/redirect-operation-pending",REJECTED_CREDENTIAL:"auth/rejected-credential",SECOND_FACTOR_ALREADY_ENROLLED:"auth/second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"auth/maximum-second-factor-count-exceeded",TENANT_ID_MISMATCH:"auth/tenant-id-mismatch",TIMEOUT:"auth/timeout",TOKEN_EXPIRED:"auth/user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"auth/too-many-requests",UNAUTHORIZED_DOMAIN:"auth/unauthorized-continue-uri",UNSUPPORTED_FIRST_FACTOR:"auth/unsupported-first-factor",UNSUPPORTED_PERSISTENCE:"auth/unsupported-persistence-type",UNSUPPORTED_TENANT_OPERATION:"auth/unsupported-tenant-operation",UNVERIFIED_EMAIL:"auth/unverified-email",USER_CANCELLED:"auth/user-cancelled",USER_DELETED:"auth/user-not-found",USER_DISABLED:"auth/user-disabled",USER_MISMATCH:"auth/user-mismatch",USER_SIGNED_OUT:"auth/user-signed-out",WEAK_PASSWORD:"auth/weak-password",WEB_STORAGE_UNSUPPORTED:"auth/web-storage-unsupported",ALREADY_INITIALIZED:"auth/already-initialized",RECAPTCHA_NOT_ENABLED:"auth/recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"auth/missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"auth/invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"auth/invalid-recaptcha-action",MISSING_CLIENT_TYPE:"auth/missing-client-type",MISSING_RECAPTCHA_VERSION:"auth/missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"auth/invalid-recaptcha-version",INVALID_REQ_TYPE:"auth/invalid-req-type",INVALID_HOSTING_LINK_DOMAIN:"auth/invalid-hosting-link-domain"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qo=new _u("@firebase/auth");function FR(r,...e){Qo.logLevel<=J.WARN&&Qo.warn(`Auth (${or}): ${r}`,...e)}function Po(r,...e){Qo.logLevel<=J.ERROR&&Qo.error(`Auth (${or}): ${r}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xe(r,...e){throw Cl(r,...e)}function Ge(r,...e){return Cl(r,...e)}function Pl(r,e,t){const n={...m_(),[e]:t};return new bs("auth","Firebase",n).create(e,{appName:r.name})}function Oe(r){return Pl(r,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function mi(r,e,t){const n=t;if(!(e instanceof n))throw n.name!==e.constructor.name&&Xe(r,"argument-error"),Pl(r,"argument-error",`Type of ${e.constructor.name} does not match expected instance.Did you pass a reference from a different Auth SDK?`)}function Cl(r,...e){if(typeof r!="string"){const t=e[0],n=[...e.slice(1)];return n[0]&&(n[0].appName=r.name),r._errorFactory.create(t,...n)}return g_.create(r,...e)}function O(r,e,...t){if(!r)throw Cl(e,...t)}function _t(r){const e="INTERNAL ASSERTION FAILED: "+r;throw Po(e),new Error(e)}function Mt(r,e){r||_t(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vs(){return typeof self<"u"&&self.location?.href||""}function Dl(){return Pf()==="http:"||Pf()==="https:"}function Pf(){return typeof self<"u"&&self.location?.protocol||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function UR(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Dl()||dI()||"connection"in navigator)?navigator.onLine:!0}function BR(){if(typeof navigator>"u")return null;const r=navigator;return r.languages&&r.languages[0]||r.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zs{constructor(e,t){this.shortDelay=e,this.longDelay=t,Mt(t>e,"Short delay should be less than long delay!"),this.isMobile=uI()||fI()}get(){return UR()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function kl(r,e){Mt(r.emulator,"Emulator should always be set here");const{url:t}=r.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class __{static initialize(e,t,n){this.fetchImpl=e,t&&(this.headersImpl=t),n&&(this.responseImpl=n)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;_t("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;_t("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;_t("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qR={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zR=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],jR=new zs(3e4,6e4);function de(r,e){return r.tenantId&&!e.tenantId?{...e,tenantId:r.tenantId}:e}async function fe(r,e,t,n,i={}){return y_(r,i,async()=>{let s={},o={};n&&(e==="GET"?o=n:s={body:JSON.stringify(n)});const c=ti({key:r.config.apiKey,...o}).slice(1),u=await r._getAdditionalHeaders();u["Content-Type"]="application/json",r.languageCode&&(u["X-Firebase-Locale"]=r.languageCode);const l={method:e,headers:u,...s};return hI()||(l.referrerPolicy="no-referrer"),r.emulatorConfig&&sr(r.emulatorConfig.host)&&(l.credentials="include"),__.fetch()(await I_(r,r.config.apiHost,t,c),l)})}async function y_(r,e,t){r._canInitEmulator=!1;const n={...qR,...e};try{const i=new $R(r),s=await Promise.race([t(),i.promise]);i.clearNetworkTimeout();const o=await s.json();if("needConfirmation"in o)throw Wi(r,"account-exists-with-different-credential",o);if(s.ok&&!("errorMessage"in o))return o;{const c=s.ok?o.errorMessage:o.error.message,[u,l]=c.split(" : ");if(u==="FEDERATED_USER_ID_ALREADY_LINKED")throw Wi(r,"credential-already-in-use",o);if(u==="EMAIL_EXISTS")throw Wi(r,"email-already-in-use",o);if(u==="USER_DISABLED")throw Wi(r,"user-disabled",o);const f=n[u]||u.toLowerCase().replace(/[_\s]+/g,"-");if(l)throw Pl(r,f,l);Xe(r,f)}}catch(i){if(i instanceof vt)throw i;Xe(r,"network-request-failed",{message:String(i)})}}async function zt(r,e,t,n,i={}){const s=await fe(r,e,t,n,i);return"mfaPendingCredential"in s&&Xe(r,"multi-factor-auth-required",{_serverResponse:s}),s}async function I_(r,e,t,n){const i=`${e}${t}?${n}`,s=r,o=s.config.emulator?kl(r.config,i):`${r.config.apiScheme}://${i}`;return zR.includes(t)&&(await s._persistenceManagerAvailable,s._getPersistenceType()==="COOKIE")?s._getPersistence()._getFinalTarget(o).toString():o}function GR(r){switch(r){case"ENFORCE":return"ENFORCE";case"AUDIT":return"AUDIT";case"OFF":return"OFF";default:return"ENFORCEMENT_STATE_UNSPECIFIED"}}class $R{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,n)=>{this.timer=setTimeout(()=>n(Ge(this.auth,"network-request-failed")),jR.get())})}}function Wi(r,e,t){const n={appName:r.name};t.email&&(n.email=t.email),t.phoneNumber&&(n.phoneNumber=t.phoneNumber);const i=Ge(r,e,n);return i.customData._tokenResponse=t,i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cf(r){return r!==void 0&&r.getResponse!==void 0}function Df(r){return r!==void 0&&r.enterprise!==void 0}class E_{constructor(e){if(this.siteKey="",this.recaptchaEnforcementState=[],e.recaptchaKey===void 0)throw new Error("recaptchaKey undefined");this.siteKey=e.recaptchaKey.split("/")[3],this.recaptchaEnforcementState=e.recaptchaEnforcementState}getProviderEnforcementState(e){if(!this.recaptchaEnforcementState||this.recaptchaEnforcementState.length===0)return null;for(const t of this.recaptchaEnforcementState)if(t.provider&&t.provider===e)return GR(t.enforcementState);return null}isProviderEnabled(e){return this.getProviderEnforcementState(e)==="ENFORCE"||this.getProviderEnforcementState(e)==="AUDIT"}isAnyProviderEnabled(){return this.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")||this.isProviderEnabled("PHONE_PROVIDER")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function KR(r){return(await fe(r,"GET","/v1/recaptchaParams")).recaptchaSiteKey||""}async function T_(r,e){return fe(r,"GET","/v2/recaptchaConfig",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function WR(r,e){return fe(r,"POST","/v1/accounts:delete",e)}async function HR(r,e){return fe(r,"POST","/v1/accounts:update",e)}async function Jo(r,e){return fe(r,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function is(r){if(r)try{const e=new Date(Number(r));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function QR(r,e=!1){return z(r).getIdToken(e)}async function w_(r,e=!1){const t=z(r),n=await t.getIdToken(e),i=Ca(n);O(i&&i.exp&&i.auth_time&&i.iat,t.auth,"internal-error");const s=typeof i.firebase=="object"?i.firebase:void 0,o=s?.sign_in_provider;return{claims:i,token:n,authTime:is(vc(i.auth_time)),issuedAtTime:is(vc(i.iat)),expirationTime:is(vc(i.exp)),signInProvider:o||null,signInSecondFactor:s?.sign_in_second_factor||null}}function vc(r){return Number(r)*1e3}function Ca(r){const[e,t,n]=r.split(".");if(e===void 0||t===void 0||n===void 0)return Po("JWT malformed, contained fewer than 3 sections"),null;try{const i=fu(t);return i?JSON.parse(i):(Po("Failed to decode base64 JWT payload"),null)}catch(i){return Po("Caught error parsing JWT payload as JSON",i?.toString()),null}}function kf(r){const e=Ca(r);return O(e,"internal-error"),O(typeof e.exp<"u","internal-error"),O(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Lt(r,e,t=!1){if(t)return e;try{return await e}catch(n){throw n instanceof vt&&JR(n)&&r.auth.currentUser===r&&await r.auth.signOut(),n}}function JR({code:r}){return r==="auth/user-disabled"||r==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class YR{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const n=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,n)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){e?.code==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lu{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=is(this.lastLoginAt),this.creationTime=is(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function As(r){const e=r.auth,t=await r.getIdToken(),n=await Lt(r,Jo(e,{idToken:t}));O(n?.users.length,e,"internal-error");const i=n.users[0];r._notifyReloadListener(i);const s=i.providerUserInfo?.length?A_(i.providerUserInfo):[],o=XR(r.providerData,s),c=r.isAnonymous,u=!(r.email&&i.passwordHash)&&!o?.length,l=c?u:!1,f={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:o,metadata:new lu(i.createdAt,i.lastLoginAt),isAnonymous:l};Object.assign(r,f)}async function v_(r){const e=z(r);await As(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function XR(r,e){return[...r.filter(n=>!e.some(i=>i.providerId===n.providerId)),...e]}function A_(r){return r.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ZR(r,e){const t=await y_(r,{},async()=>{const n=ti({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:i,apiKey:s}=r.config,o=await I_(r,i,"/v1/token",`key=${s}`),c=await r._getAdditionalHeaders();c["Content-Type"]="application/x-www-form-urlencoded";const u={method:"POST",headers:c,body:n};return r.emulatorConfig&&sr(r.emulatorConfig.host)&&(u.credentials="include"),__.fetch()(o,u)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function eS(r,e){return fe(r,"POST","/v2/accounts:revokeToken",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Pr{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){O(e.idToken,"internal-error"),O(typeof e.idToken<"u","internal-error"),O(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):kf(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){O(e.length!==0,"internal-error");const t=kf(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(O(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:n,refreshToken:i,expiresIn:s}=await ZR(e,t);this.updateTokensAndExpiration(n,i,Number(s))}updateTokensAndExpiration(e,t,n){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+n*1e3}static fromJSON(e,t){const{refreshToken:n,accessToken:i,expirationTime:s}=t,o=new Pr;return n&&(O(typeof n=="string","internal-error",{appName:e}),o.refreshToken=n),i&&(O(typeof i=="string","internal-error",{appName:e}),o.accessToken=i),s&&(O(typeof s=="number","internal-error",{appName:e}),o.expirationTime=s),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new Pr,this.toJSON())}_performRefresh(){return _t("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zt(r,e){O(typeof r=="string"||typeof r>"u","internal-error",{appName:e})}class at{constructor({uid:e,auth:t,stsTokenManager:n,...i}){this.providerId="firebase",this.proactiveRefresh=new YR(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=n,this.accessToken=n.accessToken,this.displayName=i.displayName||null,this.email=i.email||null,this.emailVerified=i.emailVerified||!1,this.phoneNumber=i.phoneNumber||null,this.photoURL=i.photoURL||null,this.isAnonymous=i.isAnonymous||!1,this.tenantId=i.tenantId||null,this.providerData=i.providerData?[...i.providerData]:[],this.metadata=new lu(i.createdAt||void 0,i.lastLoginAt||void 0)}async getIdToken(e){const t=await Lt(this,this.stsTokenManager.getToken(this.auth,e));return O(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return w_(this,e)}reload(){return v_(this)}_assign(e){this!==e&&(O(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new at({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){O(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let n=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),n=!0),t&&await As(this),await this.auth._persistUserIfCurrent(this),n&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(me(this.auth.app))return Promise.reject(Oe(this.auth));const e=await this.getIdToken();return await Lt(this,WR(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const n=t.displayName??void 0,i=t.email??void 0,s=t.phoneNumber??void 0,o=t.photoURL??void 0,c=t.tenantId??void 0,u=t._redirectEventId??void 0,l=t.createdAt??void 0,f=t.lastLoginAt??void 0,{uid:p,emailVerified:g,isAnonymous:v,providerData:D,stsTokenManager:k}=t;O(p&&k,e,"internal-error");const V=Pr.fromJSON(this.name,k);O(typeof p=="string",e,"internal-error"),Zt(n,e.name),Zt(i,e.name),O(typeof g=="boolean",e,"internal-error"),O(typeof v=="boolean",e,"internal-error"),Zt(s,e.name),Zt(o,e.name),Zt(c,e.name),Zt(u,e.name),Zt(l,e.name),Zt(f,e.name);const U=new at({uid:p,auth:e,email:i,emailVerified:g,displayName:n,isAnonymous:v,photoURL:o,phoneNumber:s,tenantId:c,stsTokenManager:V,createdAt:l,lastLoginAt:f});return D&&Array.isArray(D)&&(U.providerData=D.map(G=>({...G}))),u&&(U._redirectEventId=u),U}static async _fromIdTokenResponse(e,t,n=!1){const i=new Pr;i.updateFromServerResponse(t);const s=new at({uid:t.localId,auth:e,stsTokenManager:i,isAnonymous:n});return await As(s),s}static async _fromGetAccountInfoResponse(e,t,n){const i=t.users[0];O(i.localId!==void 0,"internal-error");const s=i.providerUserInfo!==void 0?A_(i.providerUserInfo):[],o=!(i.email&&i.passwordHash)&&!s?.length,c=new Pr;c.updateFromIdToken(n);const u=new at({uid:i.localId,auth:e,stsTokenManager:c,isAnonymous:o}),l={uid:i.localId,displayName:i.displayName||null,photoURL:i.photoUrl||null,email:i.email||null,emailVerified:i.emailVerified||!1,phoneNumber:i.phoneNumber||null,tenantId:i.tenantId||null,providerData:s,metadata:new lu(i.createdAt,i.lastLoginAt),isAnonymous:!(i.email&&i.passwordHash)&&!s?.length};return Object.assign(u,l),u}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vf=new Map;function Dt(r){Mt(r instanceof Function,"Expected a class definition");let e=Vf.get(r);return e?(Mt(e instanceof r,"Instance stored in cache mismatched with class"),e):(e=new r,Vf.set(r,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class R_{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}R_.type="NONE";const hu=R_;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Co(r,e,t){return`firebase:${r}:${e}:${t}`}class Cr{constructor(e,t,n){this.persistence=e,this.auth=t,this.userKey=n;const{config:i,name:s}=this.auth;this.fullUserKey=Co(this.userKey,i.apiKey,s),this.fullPersistenceKey=Co("persistence",i.apiKey,s),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await Jo(this.auth,{idToken:e}).catch(()=>{});return t?at._fromGetAccountInfoResponse(this.auth,t,e):null}return at._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,n="authUser"){if(!t.length)return new Cr(Dt(hu),e,n);const i=(await Promise.all(t.map(async l=>{if(await l._isAvailable())return l}))).filter(l=>l);let s=i[0]||Dt(hu);const o=Co(n,e.config.apiKey,e.name);let c=null;for(const l of t)try{const f=await l._get(o);if(f){let p;if(typeof f=="string"){const g=await Jo(e,{idToken:f}).catch(()=>{});if(!g)break;p=await at._fromGetAccountInfoResponse(e,g,f)}else p=at._fromJSON(e,f);l!==s&&(c=p),s=l;break}}catch{}const u=i.filter(l=>l._shouldAllowMigration);return!s._shouldAllowMigration||!u.length?new Cr(s,e,n):(s=u[0],c&&await s._set(o,c.toJSON()),await Promise.all(t.map(async l=>{if(l!==s)try{await l._remove(o)}catch{}})),new Cr(s,e,n))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nf(r){const e=r.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(C_(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(S_(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(k_(e))return"Blackberry";if(V_(e))return"Webos";if(b_(e))return"Safari";if((e.includes("chrome/")||P_(e))&&!e.includes("edge/"))return"Chrome";if(D_(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,n=r.match(t);if(n?.length===2)return n[1]}return"Other"}function S_(r=be()){return/firefox\//i.test(r)}function b_(r=be()){const e=r.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function P_(r=be()){return/crios\//i.test(r)}function C_(r=be()){return/iemobile/i.test(r)}function D_(r=be()){return/android/i.test(r)}function k_(r=be()){return/blackberry/i.test(r)}function V_(r=be()){return/webos/i.test(r)}function Vl(r=be()){return/iphone|ipad|ipod/i.test(r)||/macintosh/i.test(r)&&/mobile/i.test(r)}function tS(r=be()){return Vl(r)&&!!window.navigator?.standalone}function nS(){return pI()&&document.documentMode===10}function N_(r=be()){return Vl(r)||D_(r)||V_(r)||k_(r)||/windows phone/i.test(r)||C_(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function O_(r,e=[]){let t;switch(r){case"Browser":t=Nf(be());break;case"Worker":t=`${Nf(be())}-${r}`;break;default:t=r}const n=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${or}/${n}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rS{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const n=s=>new Promise((o,c)=>{try{const u=e(s);o(u)}catch(u){c(u)}});n.onAbort=t,this.queue.push(n);const i=this.queue.length-1;return()=>{this.queue[i]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const n of this.queue)await n(e),n.onAbort&&t.push(n.onAbort)}catch(n){t.reverse();for(const i of t)try{i()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:n?.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function iS(r,e={}){return fe(r,"GET","/v2/passwordPolicy",de(r,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sS=6;class oS{constructor(e){const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??sS,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=e.allowedNonAlphanumericCharacters?.join("")??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const n=this.customStrengthOptions.minPasswordLength,i=this.customStrengthOptions.maxPasswordLength;n&&(t.meetsMinPasswordLength=e.length>=n),i&&(t.meetsMaxPasswordLength=e.length<=i)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let n;for(let i=0;i<e.length;i++)n=e.charAt(i),this.updatePasswordCharacterOptionsStatuses(t,n>="a"&&n<="z",n>="A"&&n<="Z",n>="0"&&n<="9",this.allowedNonAlphanumericCharacters.includes(n))}updatePasswordCharacterOptionsStatuses(e,t,n,i,s){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=n)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=i)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aS{constructor(e,t,n,i){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=n,this.config=i,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Of(this),this.idTokenSubscription=new Of(this),this.beforeStateQueue=new rS(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=g_,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=i.sdkClientVersion,this._persistenceManagerAvailable=new Promise(s=>this._resolvePersistenceManagerAvailable=s)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=Dt(t)),this._initializationPromise=this.queue(async()=>{if(!this._deleted&&(this.persistenceManager=await Cr.create(this,e),this._resolvePersistenceManagerAvailable?.(),!this._deleted)){if(this._popupRedirectResolver?._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=this.currentUser?.uid||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await Jo(this,{idToken:e}),n=await at._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(n)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){if(me(this.app)){const s=this.app.settings.authIdToken;return s?new Promise(o=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(s).then(o,o))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let n=t,i=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const s=this.redirectUser?._redirectEventId,o=n?._redirectEventId,c=await this.tryRedirectSignIn(e);(!s||s===o)&&c?.user&&(n=c.user,i=!0)}if(!n)return this.directlySetCurrentUser(null);if(!n._redirectEventId){if(i)try{await this.beforeStateQueue.runMiddleware(n)}catch(s){n=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(s))}return n?this.reloadAndSetCurrentUserOrClear(n):this.directlySetCurrentUser(null)}return O(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===n._redirectEventId?this.directlySetCurrentUser(n):this.reloadAndSetCurrentUserOrClear(n)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await As(e)}catch(t){if(t?.code!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=BR()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(me(this.app))return Promise.reject(Oe(this));const t=e?z(e):null;return t&&O(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&O(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return me(this.app)?Promise.reject(Oe(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return me(this.app)?Promise.reject(Oe(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(Dt(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await iS(this),t=new oS(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new bs("auth","Firebase",e())}onAuthStateChanged(e,t,n){return this.registerStateListener(this.authStateSubscription,e,t,n)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,n){return this.registerStateListener(this.idTokenSubscription,e,t,n)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const n=this.onAuthStateChanged(()=>{n(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),n={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(n.tenantId=this.tenantId),await eS(this,n)}}toJSON(){return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:this._currentUser?.toJSON()}}async _setRedirectUser(e,t){const n=await this.getOrInitRedirectPersistenceManager(t);return e===null?n.removeCurrentUser():n.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&Dt(e)||this._popupRedirectResolver;O(t,this,"argument-error"),this.redirectPersistenceManager=await Cr.create(this,[Dt(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){return this._isInitialized&&await this.queue(async()=>{}),this._currentUser?._redirectEventId===e?this._currentUser:this.redirectUser?._redirectEventId===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=this.currentUser?.uid??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,n,i){if(this._deleted)return()=>{};const s=typeof t=="function"?t:t.next.bind(t);let o=!1;const c=this._isInitialized?Promise.resolve():this._initializationPromise;if(O(c,this,"internal-error"),c.then(()=>{o||s(this.currentUser)}),typeof t=="function"){const u=e.addObserver(t,n,i);return()=>{o=!0,u()}}else{const u=e.addObserver(t);return()=>{o=!0,u()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return O(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=O_(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await this.heartbeatServiceProvider.getImmediate({optional:!0})?.getHeartbeatsHeader();t&&(e["X-Firebase-Client"]=t);const n=await this._getAppCheckToken();return n&&(e["X-Firebase-AppCheck"]=n),e}async _getAppCheckToken(){if(me(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await this.appCheckServiceProvider.getImmediate({optional:!0})?.getToken();return e?.error&&FR(`Error while retrieving App Check token: ${e.error}`),e?.token}}function Ee(r){return z(r)}class Of{constructor(e){this.auth=e,this.observer=null,this.addObserver=EI(t=>this.observer=t)}get next(){return O(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let js={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function cS(r){js=r}function Nl(r){return js.loadJS(r)}function uS(){return js.recaptchaV2Script}function lS(){return js.recaptchaEnterpriseScript}function hS(){return js.gapiScript}function x_(r){return`__${r}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dS=500,fS=6e4,go=1e12;class pS{constructor(e){this.auth=e,this.counter=go,this._widgets=new Map}render(e,t){const n=this.counter;return this._widgets.set(n,new _S(e,this.auth.name,t||{})),this.counter++,n}reset(e){const t=e||go;this._widgets.get(t)?.delete(),this._widgets.delete(t)}getResponse(e){const t=e||go;return this._widgets.get(t)?.getResponse()||""}async execute(e){const t=e||go;return this._widgets.get(t)?.execute(),""}}class mS{constructor(){this.enterprise=new gS}ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class gS{ready(e){e()}execute(e,t){return Promise.resolve("token")}render(e,t){return""}}class _S{constructor(e,t,n){this.params=n,this.timerId=null,this.deleted=!1,this.responseToken=null,this.clickHandler=()=>{this.execute()};const i=typeof e=="string"?document.getElementById(e):e;O(i,"argument-error",{appName:t}),this.container=i,this.isVisible=this.params.size!=="invisible",this.isVisible?this.execute():this.container.addEventListener("click",this.clickHandler)}getResponse(){return this.checkIfDeleted(),this.responseToken}delete(){this.checkIfDeleted(),this.deleted=!0,this.timerId&&(clearTimeout(this.timerId),this.timerId=null),this.container.removeEventListener("click",this.clickHandler)}execute(){this.checkIfDeleted(),!this.timerId&&(this.timerId=window.setTimeout(()=>{this.responseToken=yS(50);const{callback:e,"expired-callback":t}=this.params;if(e)try{e(this.responseToken)}catch{}this.timerId=window.setTimeout(()=>{if(this.timerId=null,this.responseToken=null,t)try{t()}catch{}this.isVisible&&this.execute()},fS)},dS))}checkIfDeleted(){if(this.deleted)throw new Error("reCAPTCHA mock was already deleted!")}}function yS(r){const e=[],t="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";for(let n=0;n<r;n++)e.push(t.charAt(Math.floor(Math.random()*t.length)));return e.join("")}const IS="recaptcha-enterprise",ss="NO_RECAPTCHA";class M_{constructor(e){this.type=IS,this.auth=Ee(e)}async verify(e="verify",t=!1){async function n(s){if(!t){if(s.tenantId==null&&s._agentRecaptchaConfig!=null)return s._agentRecaptchaConfig.siteKey;if(s.tenantId!=null&&s._tenantRecaptchaConfigs[s.tenantId]!==void 0)return s._tenantRecaptchaConfigs[s.tenantId].siteKey}return new Promise(async(o,c)=>{T_(s,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}).then(u=>{if(u.recaptchaKey===void 0)c(new Error("recaptcha Enterprise site key undefined"));else{const l=new E_(u);return s.tenantId==null?s._agentRecaptchaConfig=l:s._tenantRecaptchaConfigs[s.tenantId]=l,o(l.siteKey)}}).catch(u=>{c(u)})})}function i(s,o,c){const u=window.grecaptcha;Df(u)?u.enterprise.ready(()=>{u.enterprise.execute(s,{action:e}).then(l=>{o(l)}).catch(()=>{o(ss)})}):c(Error("No reCAPTCHA enterprise script loaded."))}return this.auth.settings.appVerificationDisabledForTesting?new mS().execute("siteKey",{action:"verify"}):new Promise((s,o)=>{n(this.auth).then(c=>{if(!t&&Df(window.grecaptcha))i(c,s,o);else{if(typeof window>"u"){o(new Error("RecaptchaVerifier is only supported in browser"));return}let u=lS();u.length!==0&&(u+=c),Nl(u).then(()=>{i(c,s,o)}).catch(l=>{o(l)})}}).catch(c=>{o(c)})})}}async function Bi(r,e,t,n=!1,i=!1){const s=new M_(r);let o;if(i)o=ss;else try{o=await s.verify(t)}catch{o=await s.verify(t,!0)}const c={...e};if(t==="mfaSmsEnrollment"||t==="mfaSmsSignIn"){if("phoneEnrollmentInfo"in c){const u=c.phoneEnrollmentInfo.phoneNumber,l=c.phoneEnrollmentInfo.recaptchaToken;Object.assign(c,{phoneEnrollmentInfo:{phoneNumber:u,recaptchaToken:l,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}else if("phoneSignInInfo"in c){const u=c.phoneSignInInfo.recaptchaToken;Object.assign(c,{phoneSignInInfo:{recaptchaToken:u,captchaResponse:o,clientType:"CLIENT_TYPE_WEB",recaptchaVersion:"RECAPTCHA_ENTERPRISE"}})}return c}return n?Object.assign(c,{captchaResp:o}):Object.assign(c,{captchaResponse:o}),Object.assign(c,{clientType:"CLIENT_TYPE_WEB"}),Object.assign(c,{recaptchaVersion:"RECAPTCHA_ENTERPRISE"}),c}async function cn(r,e,t,n,i){if(i==="EMAIL_PASSWORD_PROVIDER")if(r._getRecaptchaConfig()?.isProviderEnabled("EMAIL_PASSWORD_PROVIDER")){const s=await Bi(r,e,t,t==="getOobCode");return n(r,s)}else return n(r,e).catch(async s=>{if(s.code==="auth/missing-recaptcha-token"){console.log(`${t} is protected by reCAPTCHA Enterprise for this project. Automatically triggering the reCAPTCHA flow and restarting the flow.`);const o=await Bi(r,e,t,t==="getOobCode");return n(r,o)}else return Promise.reject(s)});else if(i==="PHONE_PROVIDER")if(r._getRecaptchaConfig()?.isProviderEnabled("PHONE_PROVIDER")){const s=await Bi(r,e,t);return n(r,s).catch(async o=>{if(r._getRecaptchaConfig()?.getProviderEnforcementState("PHONE_PROVIDER")==="AUDIT"&&(o.code==="auth/missing-recaptcha-token"||o.code==="auth/invalid-app-credential")){console.log(`Failed to verify with reCAPTCHA Enterprise. Automatically triggering the reCAPTCHA v2 flow to complete the ${t} flow.`);const c=await Bi(r,e,t,!1,!0);return n(r,c)}return Promise.reject(o)})}else{const s=await Bi(r,e,t,!1,!0);return n(r,s)}else return Promise.reject(i+" provider is not supported.")}async function L_(r){const e=Ee(r),t=await T_(e,{clientType:"CLIENT_TYPE_WEB",version:"RECAPTCHA_ENTERPRISE"}),n=new E_(t);e.tenantId==null?e._agentRecaptchaConfig=n:e._tenantRecaptchaConfigs[e.tenantId]=n,n.isAnyProviderEnabled()&&new M_(e).verify()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F_(r,e){const t=ni(r,"auth");if(t.isInitialized()){const i=t.getImmediate(),s=t.getOptions();if(lt(s,e??{}))return i;Xe(i,"already-initialized")}return t.initialize({options:e})}function ES(r,e){const t=e?.persistence||[],n=(Array.isArray(t)?t:[t]).map(Dt);e?.errorMap&&r._updateErrorMap(e.errorMap),r._initializeWithPersistence(n,e?.popupRedirectResolver)}function U_(r,e,t){const n=Ee(r);O(/^https?:\/\//.test(e),n,"invalid-emulator-scheme");const i=!!t?.disableWarnings,s=B_(e),{host:o,port:c}=TS(e),u=c===null?"":`:${c}`,l={url:`${s}//${o}${u}/`},f=Object.freeze({host:o,port:c,protocol:s.replace(":",""),options:Object.freeze({disableWarnings:i})});if(!n._canInitEmulator){O(n.config.emulator&&n.emulatorConfig,n,"emulator-config-failed"),O(lt(l,n.config.emulator)&&lt(f,n.emulatorConfig),n,"emulator-config-failed");return}n.config.emulator=l,n.emulatorConfig=f,n.settings.appVerificationDisabledForTesting=!0,sr(o)?(mu(`${s}//${o}${u}`),ep("Auth",!0)):i||wS()}function B_(r){const e=r.indexOf(":");return e<0?"":r.substr(0,e+1)}function TS(r){const e=B_(r),t=/(\/\/)?([^?#/]+)/.exec(r.substr(e.length));if(!t)return{host:"",port:null};const n=t[2].split("@").pop()||"",i=/^(\[[^\]]+\])(:|$)/.exec(n);if(i){const s=i[1];return{host:s,port:xf(n.substr(s.length+1))}}else{const[s,o]=n.split(":");return{host:s,port:xf(o)}}}function xf(r){if(!r)return null;const e=Number(r);return isNaN(e)?null:e}function wS(){function r(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",r):r())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gi{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return _t("not implemented")}_getIdTokenResponse(e){return _t("not implemented")}_linkToIdToken(e,t){return _t("not implemented")}_getReauthenticationResolver(e){return _t("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function q_(r,e){return fe(r,"POST","/v1/accounts:resetPassword",de(r,e))}async function vS(r,e){return fe(r,"POST","/v1/accounts:update",e)}async function AS(r,e){return fe(r,"POST","/v1/accounts:signUp",e)}async function RS(r,e){return fe(r,"POST","/v1/accounts:update",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function SS(r,e){return zt(r,"POST","/v1/accounts:signInWithPassword",de(r,e))}async function Da(r,e){return fe(r,"POST","/v1/accounts:sendOobCode",de(r,e))}async function bS(r,e){return Da(r,e)}async function PS(r,e){return Da(r,e)}async function CS(r,e){return Da(r,e)}async function DS(r,e){return Da(r,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function kS(r,e){return zt(r,"POST","/v1/accounts:signInWithEmailLink",de(r,e))}async function VS(r,e){return zt(r,"POST","/v1/accounts:signInWithEmailLink",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ei extends gi{constructor(e,t,n,i=null){super("password",n),this._email=e,this._password=t,this._tenantId=i}static _fromEmailAndPassword(e,t){return new ei(e,t,"password")}static _fromEmailAndCode(e,t,n=null){return new ei(e,t,"emailLink",n)}toJSON(){return{email:this._email,password:this._password,signInMethod:this.signInMethod,tenantId:this._tenantId}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;if(t?.email&&t?.password){if(t.signInMethod==="password")return this._fromEmailAndPassword(t.email,t.password);if(t.signInMethod==="emailLink")return this._fromEmailAndCode(t.email,t.password,t.tenantId)}return null}async _getIdTokenResponse(e){switch(this.signInMethod){case"password":const t={returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return cn(e,t,"signInWithPassword",SS,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return kS(e,{email:this._email,oobCode:this._password});default:Xe(e,"internal-error")}}async _linkToIdToken(e,t){switch(this.signInMethod){case"password":const n={idToken:t,returnSecureToken:!0,email:this._email,password:this._password,clientType:"CLIENT_TYPE_WEB"};return cn(e,n,"signUpPassword",AS,"EMAIL_PASSWORD_PROVIDER");case"emailLink":return VS(e,{idToken:t,email:this._email,oobCode:this._password});default:Xe(e,"internal-error")}}_getReauthenticationResolver(e){return this._getIdTokenResponse(e)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Vt(r,e){return zt(r,"POST","/v1/accounts:signInWithIdp",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const NS="http://localhost";class wt extends gi{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new wt(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):Xe("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:i,...s}=t;if(!n||!i)return null;const o=new wt(n,i);return o.idToken=s.idToken||void 0,o.accessToken=s.accessToken||void 0,o.secret=s.secret,o.nonce=s.nonce,o.pendingToken=s.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return Vt(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Vt(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Vt(e,t)}buildRequest(){const e={requestUri:NS,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=ti(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mf(r,e){return fe(r,"POST","/v1/accounts:sendVerificationCode",de(r,e))}async function OS(r,e){return zt(r,"POST","/v1/accounts:signInWithPhoneNumber",de(r,e))}async function xS(r,e){const t=await zt(r,"POST","/v1/accounts:signInWithPhoneNumber",de(r,e));if(t.temporaryProof)throw Wi(r,"account-exists-with-different-credential",t);return t}const MS={USER_NOT_FOUND:"user-not-found"};async function LS(r,e){const t={...e,operation:"REAUTH"};return zt(r,"POST","/v1/accounts:signInWithPhoneNumber",de(r,t),MS)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class un extends gi{constructor(e){super("phone","phone"),this.params=e}static _fromVerification(e,t){return new un({verificationId:e,verificationCode:t})}static _fromTokenResponse(e,t){return new un({phoneNumber:e,temporaryProof:t})}_getIdTokenResponse(e){return OS(e,this._makeVerificationRequest())}_linkToIdToken(e,t){return xS(e,{idToken:t,...this._makeVerificationRequest()})}_getReauthenticationResolver(e){return LS(e,this._makeVerificationRequest())}_makeVerificationRequest(){const{temporaryProof:e,phoneNumber:t,verificationId:n,verificationCode:i}=this.params;return e&&t?{temporaryProof:e,phoneNumber:t}:{sessionInfo:n,code:i}}toJSON(){const e={providerId:this.providerId};return this.params.phoneNumber&&(e.phoneNumber=this.params.phoneNumber),this.params.temporaryProof&&(e.temporaryProof=this.params.temporaryProof),this.params.verificationCode&&(e.verificationCode=this.params.verificationCode),this.params.verificationId&&(e.verificationId=this.params.verificationId),e}static fromJSON(e){typeof e=="string"&&(e=JSON.parse(e));const{verificationId:t,verificationCode:n,phoneNumber:i,temporaryProof:s}=e;return!n&&!t&&!i&&!s?null:new un({verificationId:t,verificationCode:n,phoneNumber:i,temporaryProof:s})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function FS(r){switch(r){case"recoverEmail":return"RECOVER_EMAIL";case"resetPassword":return"PASSWORD_RESET";case"signIn":return"EMAIL_SIGNIN";case"verifyEmail":return"VERIFY_EMAIL";case"verifyAndChangeEmail":return"VERIFY_AND_CHANGE_EMAIL";case"revertSecondFactorAddition":return"REVERT_SECOND_FACTOR_ADDITION";default:return null}}function US(r){const e=qi(zi(r)).link,t=e?qi(zi(e)).deep_link_id:null,n=qi(zi(r)).deep_link_id;return(n?qi(zi(n)).link:null)||n||t||e||r}class _i{constructor(e){const t=qi(zi(e)),n=t.apiKey??null,i=t.oobCode??null,s=FS(t.mode??null);O(n&&i&&s,"argument-error"),this.apiKey=n,this.operation=s,this.code=i,this.continueUrl=t.continueUrl??null,this.languageCode=t.lang??null,this.tenantId=t.tenantId??null}static parseLink(e){const t=US(e);try{return new _i(t)}catch{return null}}}function BS(r){return _i.parseLink(r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bn{constructor(){this.providerId=bn.PROVIDER_ID}static credential(e,t){return ei._fromEmailAndPassword(e,t)}static credentialWithLink(e,t){const n=_i.parseLink(t);return O(n,"argument-error"),ei._fromEmailAndCode(e,n.code,n.tenantId)}}bn.PROVIDER_ID="password";bn.EMAIL_PASSWORD_SIGN_IN_METHOD="password";bn.EMAIL_LINK_SIGN_IN_METHOD="emailLink";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yi extends jt{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}class os extends yi{static credentialFromJSON(e){const t=typeof e=="string"?JSON.parse(e):e;return O("providerId"in t&&"signInMethod"in t,"argument-error"),wt._fromParams(t)}credential(e){return this._credential({...e,nonce:e.rawNonce})}_credential(e){return O(e.idToken||e.accessToken,"argument-error"),wt._fromParams({...e,providerId:this.providerId,signInMethod:this.providerId})}static credentialFromResult(e){return os.oauthCredentialFromTaggedObject(e)}static credentialFromError(e){return os.oauthCredentialFromTaggedObject(e.customData||{})}static oauthCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n,oauthTokenSecret:i,pendingToken:s,nonce:o,providerId:c}=e;if(!n&&!i&&!t&&!s||!c)return null;try{return new os(c)._credential({idToken:t,accessToken:n,nonce:o,pendingToken:s})}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class At extends yi{constructor(){super("facebook.com")}static credential(e){return wt._fromParams({providerId:At.PROVIDER_ID,signInMethod:At.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return At.credentialFromTaggedObject(e)}static credentialFromError(e){return At.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return At.credential(e.oauthAccessToken)}catch{return null}}}At.FACEBOOK_SIGN_IN_METHOD="facebook.com";At.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rt extends yi{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return wt._fromParams({providerId:Rt.PROVIDER_ID,signInMethod:Rt.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return Rt.credentialFromTaggedObject(e)}static credentialFromError(e){return Rt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:n}=e;if(!t&&!n)return null;try{return Rt.credential(t,n)}catch{return null}}}Rt.GOOGLE_SIGN_IN_METHOD="google.com";Rt.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class St extends yi{constructor(){super("github.com")}static credential(e){return wt._fromParams({providerId:St.PROVIDER_ID,signInMethod:St.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return St.credentialFromTaggedObject(e)}static credentialFromError(e){return St.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return St.credential(e.oauthAccessToken)}catch{return null}}}St.GITHUB_SIGN_IN_METHOD="github.com";St.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qS="http://localhost";class Rs extends gi{constructor(e,t){super(e,e),this.pendingToken=t}_getIdTokenResponse(e){const t=this.buildRequest();return Vt(e,t)}_linkToIdToken(e,t){const n=this.buildRequest();return n.idToken=t,Vt(e,n)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,Vt(e,t)}toJSON(){return{signInMethod:this.signInMethod,providerId:this.providerId,pendingToken:this.pendingToken}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:n,signInMethod:i,pendingToken:s}=t;return!n||!i||!s||n!==i?null:new Rs(n,s)}static _create(e,t){return new Rs(e,t)}buildRequest(){return{requestUri:qS,returnSecureToken:!0,pendingToken:this.pendingToken}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zS="saml.";class Yo extends jt{constructor(e){O(e.startsWith(zS),"argument-error"),super(e)}static credentialFromResult(e){return Yo.samlCredentialFromTaggedObject(e)}static credentialFromError(e){return Yo.samlCredentialFromTaggedObject(e.customData||{})}static credentialFromJSON(e){const t=Rs.fromJSON(e);return O(t,"argument-error"),t}static samlCredentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{pendingToken:t,providerId:n}=e;if(!t||!n)return null;try{return Rs._create(n,t)}catch{return null}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bt extends yi{constructor(){super("twitter.com")}static credential(e,t){return wt._fromParams({providerId:bt.PROVIDER_ID,signInMethod:bt.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return bt.credentialFromTaggedObject(e)}static credentialFromError(e){return bt.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:n}=e;if(!t||!n)return null;try{return bt.credential(t,n)}catch{return null}}}bt.TWITTER_SIGN_IN_METHOD="twitter.com";bt.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function z_(r,e){return zt(r,"POST","/v1/accounts:signUp",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class st{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,n,i=!1){const s=await at._fromIdTokenResponse(e,n,i),o=Lf(n);return new st({user:s,providerId:o,_tokenResponse:n,operationType:t})}static async _forOperation(e,t,n){await e._updateTokensIfNecessary(n,!0);const i=Lf(n);return new st({user:e,providerId:i,_tokenResponse:n,operationType:t})}}function Lf(r){return r.providerId?r.providerId:"phoneNumber"in r?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jS(r){if(me(r.app))return Promise.reject(Oe(r));const e=Ee(r);if(await e._initializationPromise,e.currentUser?.isAnonymous)return new st({user:e.currentUser,providerId:null,operationType:"signIn"});const t=await z_(e,{returnSecureToken:!0}),n=await st._fromIdTokenResponse(e,"signIn",t,!0);return await e._updateCurrentUser(n.user),n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xo extends vt{constructor(e,t,n,i){super(t.code,t.message),this.operationType=n,this.user=i,Object.setPrototypeOf(this,Xo.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:n}}static _fromErrorAndOperation(e,t,n,i){return new Xo(e,t,n,i)}}function j_(r,e,t,n){return(e==="reauthenticate"?t._getReauthenticationResolver(r):t._getIdTokenResponse(r)).catch(s=>{throw s.code==="auth/multi-factor-auth-required"?Xo._fromErrorAndOperation(r,s,e,n):s})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function G_(r){return new Set(r.map(({providerId:e})=>e).filter(e=>!!e))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function GS(r,e){const t=z(r);await ka(!0,t,e);const{providerUserInfo:n}=await HR(t.auth,{idToken:await t.getIdToken(),deleteProvider:[e]}),i=G_(n||[]);return t.providerData=t.providerData.filter(s=>i.has(s.providerId)),i.has("phone")||(t.phoneNumber=null),await t.auth._persistUserIfCurrent(t),t}async function Ol(r,e,t=!1){const n=await Lt(r,e._linkToIdToken(r.auth,await r.getIdToken()),t);return st._forOperation(r,"link",n)}async function ka(r,e,t){await As(e);const n=G_(e.providerData),i=r===!1?"provider-already-linked":"no-such-provider";O(n.has(t)===r,e.auth,i)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $_(r,e,t=!1){const{auth:n}=r;if(me(n.app))return Promise.reject(Oe(n));const i="reauthenticate";try{const s=await Lt(r,j_(n,i,e,r),t);O(s.idToken,n,"internal-error");const o=Ca(s.idToken);O(o,n,"internal-error");const{sub:c}=o;return O(r.uid===c,n,"user-mismatch"),st._forOperation(r,i,s)}catch(s){throw s?.code==="auth/user-not-found"&&Xe(n,"user-mismatch"),s}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function K_(r,e,t=!1){if(me(r.app))return Promise.reject(Oe(r));const n="signIn",i=await j_(r,n,e),s=await st._fromIdTokenResponse(r,n,i);return t||await r._updateCurrentUser(s.user),s}async function Va(r,e){return K_(Ee(r),e)}async function W_(r,e){const t=z(r);return await ka(!1,t,e.providerId),Ol(t,e)}async function H_(r,e){return $_(z(r),e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function $S(r,e){return zt(r,"POST","/v1/accounts:signInWithCustomToken",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function KS(r,e){if(me(r.app))return Promise.reject(Oe(r));const t=Ee(r),n=await $S(t,{token:e,returnSecureToken:!0}),i=await st._fromIdTokenResponse(t,"signIn",n);return await t._updateCurrentUser(i.user),i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gs{constructor(e,t){this.factorId=e,this.uid=t.mfaEnrollmentId,this.enrollmentTime=new Date(t.enrolledAt).toUTCString(),this.displayName=t.displayName}static _fromServerResponse(e,t){return"phoneInfo"in t?xl._fromServerResponse(e,t):"totpInfo"in t?Ml._fromServerResponse(e,t):Xe(e,"internal-error")}}class xl extends Gs{constructor(e){super("phone",e),this.phoneNumber=e.phoneInfo}static _fromServerResponse(e,t){return new xl(t)}}class Ml extends Gs{constructor(e){super("totp",e)}static _fromServerResponse(e,t){return new Ml(t)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Na(r,e,t){O(t.url?.length>0,r,"invalid-continue-uri"),O(typeof t.dynamicLinkDomain>"u"||t.dynamicLinkDomain.length>0,r,"invalid-dynamic-link-domain"),O(typeof t.linkDomain>"u"||t.linkDomain.length>0,r,"invalid-hosting-link-domain"),e.continueUrl=t.url,e.dynamicLinkDomain=t.dynamicLinkDomain,e.linkDomain=t.linkDomain,e.canHandleCodeInApp=t.handleCodeInApp,t.iOS&&(O(t.iOS.bundleId.length>0,r,"missing-ios-bundle-id"),e.iOSBundleId=t.iOS.bundleId),t.android&&(O(t.android.packageName.length>0,r,"missing-android-pkg-name"),e.androidInstallApp=t.android.installApp,e.androidMinimumVersionCode=t.android.minimumVersion,e.androidPackageName=t.android.packageName)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ll(r){const e=Ee(r);e._getPasswordPolicyInternal()&&await e._updatePasswordPolicy()}async function WS(r,e,t){const n=Ee(r),i={requestType:"PASSWORD_RESET",email:e,clientType:"CLIENT_TYPE_WEB"};t&&Na(n,i,t),await cn(n,i,"getOobCode",PS,"EMAIL_PASSWORD_PROVIDER")}async function HS(r,e,t){await q_(z(r),{oobCode:e,newPassword:t}).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&Ll(r),n})}async function QS(r,e){await RS(z(r),{oobCode:e})}async function Q_(r,e){const t=z(r),n=await q_(t,{oobCode:e}),i=n.requestType;switch(O(i,t,"internal-error"),i){case"EMAIL_SIGNIN":break;case"VERIFY_AND_CHANGE_EMAIL":O(n.newEmail,t,"internal-error");break;case"REVERT_SECOND_FACTOR_ADDITION":O(n.mfaInfo,t,"internal-error");default:O(n.email,t,"internal-error")}let s=null;return n.mfaInfo&&(s=Gs._fromServerResponse(Ee(t),n.mfaInfo)),{data:{email:(n.requestType==="VERIFY_AND_CHANGE_EMAIL"?n.newEmail:n.email)||null,previousEmail:(n.requestType==="VERIFY_AND_CHANGE_EMAIL"?n.email:n.newEmail)||null,multiFactorInfo:s},operation:i}}async function JS(r,e){const{data:t}=await Q_(z(r),e);return t.email}async function YS(r,e,t){if(me(r.app))return Promise.reject(Oe(r));const n=Ee(r),o=await cn(n,{returnSecureToken:!0,email:e,password:t,clientType:"CLIENT_TYPE_WEB"},"signUpPassword",z_,"EMAIL_PASSWORD_PROVIDER").catch(u=>{throw u.code==="auth/password-does-not-meet-requirements"&&Ll(r),u}),c=await st._fromIdTokenResponse(n,"signIn",o);return await n._updateCurrentUser(c.user),c}function XS(r,e,t){return me(r.app)?Promise.reject(Oe(r)):Va(z(r),bn.credential(e,t)).catch(async n=>{throw n.code==="auth/password-does-not-meet-requirements"&&Ll(r),n})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ZS(r,e,t){const n=Ee(r),i={requestType:"EMAIL_SIGNIN",email:e,clientType:"CLIENT_TYPE_WEB"};function s(o,c){O(c.handleCodeInApp,n,"argument-error"),c&&Na(n,o,c)}s(i,t),await cn(n,i,"getOobCode",CS,"EMAIL_PASSWORD_PROVIDER")}function eb(r,e){return _i.parseLink(e)?.operation==="EMAIL_SIGNIN"}async function tb(r,e,t){if(me(r.app))return Promise.reject(Oe(r));const n=z(r),i=bn.credentialWithLink(e,t||vs());return O(i._tenantId===(n.tenantId||null),n,"tenant-id-mismatch"),Va(n,i)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function nb(r,e){return fe(r,"POST","/v1/accounts:createAuthUri",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function rb(r,e){const t=Dl()?vs():"http://localhost",n={identifier:e,continueUri:t},{signinMethods:i}=await nb(z(r),n);return i||[]}async function ib(r,e){const t=z(r),i={requestType:"VERIFY_EMAIL",idToken:await r.getIdToken()};e&&Na(t.auth,i,e);const{email:s}=await bS(t.auth,i);s!==r.email&&await r.reload()}async function sb(r,e,t){const n=z(r),s={requestType:"VERIFY_AND_CHANGE_EMAIL",idToken:await r.getIdToken(),newEmail:e};t&&Na(n.auth,s,t);const{email:o}=await DS(n.auth,s);o!==r.email&&await r.reload()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ob(r,e){return fe(r,"POST","/v1/accounts:update",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ab(r,{displayName:e,photoURL:t}){if(e===void 0&&t===void 0)return;const n=z(r),s={idToken:await n.getIdToken(),displayName:e,photoUrl:t,returnSecureToken:!0},o=await Lt(n,ob(n.auth,s));n.displayName=o.displayName||null,n.photoURL=o.photoUrl||null;const c=n.providerData.find(({providerId:u})=>u==="password");c&&(c.displayName=n.displayName,c.photoURL=n.photoURL),await n._updateTokensIfNecessary(o)}function cb(r,e){const t=z(r);return me(t.auth.app)?Promise.reject(Oe(t.auth)):J_(t,e,null)}function ub(r,e){return J_(z(r),null,e)}async function J_(r,e,t){const{auth:n}=r,s={idToken:await r.getIdToken(),returnSecureToken:!0};e&&(s.email=e),t&&(s.password=t);const o=await Lt(r,vS(n,s));await r._updateTokensIfNecessary(o,!0)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function lb(r){if(!r)return null;const{providerId:e}=r,t=r.rawUserInfo?JSON.parse(r.rawUserInfo):{},n=r.isNewUser||r.kind==="identitytoolkit#SignupNewUserResponse";if(!e&&r?.idToken){const i=Ca(r.idToken)?.firebase?.sign_in_provider;if(i){const s=i!=="anonymous"&&i!=="custom"?i:null;return new Dr(n,s)}}if(!e)return null;switch(e){case"facebook.com":return new hb(n,t);case"github.com":return new db(n,t);case"google.com":return new fb(n,t);case"twitter.com":return new pb(n,t,r.screenName||null);case"custom":case"anonymous":return new Dr(n,null);default:return new Dr(n,e,t)}}class Dr{constructor(e,t,n={}){this.isNewUser=e,this.providerId=t,this.profile=n}}class Y_ extends Dr{constructor(e,t,n,i){super(e,t,n),this.username=i}}class hb extends Dr{constructor(e,t){super(e,"facebook.com",t)}}class db extends Y_{constructor(e,t){super(e,"github.com",t,typeof t?.login=="string"?t?.login:null)}}class fb extends Dr{constructor(e,t){super(e,"google.com",t)}}class pb extends Y_{constructor(e,t,n){super(e,"twitter.com",t,n)}}function mb(r){const{user:e,_tokenResponse:t}=r;return e.isAnonymous&&!t?{providerId:null,isNewUser:!1,profile:null}:lb(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gb(r,e){return z(r).setPersistence(e)}function _b(r){return L_(r)}async function yb(r,e){return Ee(r).validatePassword(e)}function X_(r,e,t,n){return z(r).onIdTokenChanged(e,t,n)}function Z_(r,e,t){return z(r).beforeAuthStateChanged(e,t)}function Ib(r,e,t,n){return z(r).onAuthStateChanged(e,t,n)}function Eb(r){z(r).useDeviceLanguage()}function Tb(r,e){return z(r).updateCurrentUser(e)}function wb(r){return z(r).signOut()}function vb(r,e){return Ee(r).revokeAccessToken(e)}async function Ab(r){return z(r).delete()}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jn{constructor(e,t,n){this.type=e,this.credential=t,this.user=n}static _fromIdtoken(e,t){return new jn("enroll",e,t)}static _fromMfaPendingCredential(e){return new jn("signin",e)}toJSON(){return{multiFactorSession:{[this.type==="enroll"?"idToken":"pendingCredential"]:this.credential}}}static fromJSON(e){if(e?.multiFactorSession){if(e.multiFactorSession?.pendingCredential)return jn._fromMfaPendingCredential(e.multiFactorSession.pendingCredential);if(e.multiFactorSession?.idToken)return jn._fromIdtoken(e.multiFactorSession.idToken)}return null}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fl{constructor(e,t,n){this.session=e,this.hints=t,this.signInResolver=n}static _fromError(e,t){const n=Ee(e),i=t.customData._serverResponse,s=(i.mfaInfo||[]).map(c=>Gs._fromServerResponse(n,c));O(i.mfaPendingCredential,n,"internal-error");const o=jn._fromMfaPendingCredential(i.mfaPendingCredential);return new Fl(o,s,async c=>{const u=await c._process(n,o);delete i.mfaInfo,delete i.mfaPendingCredential;const l={...i,idToken:u.idToken,refreshToken:u.refreshToken};switch(t.operationType){case"signIn":const f=await st._fromIdTokenResponse(n,t.operationType,l);return await n._updateCurrentUser(f.user),f;case"reauthenticate":return O(t.user,n,"internal-error"),st._forOperation(t.user,t.operationType,l);default:Xe(n,"internal-error")}})}async resolveSignIn(e){const t=e;return this.signInResolver(t)}}function Rb(r,e){const t=z(r),n=e;return O(e.customData.operationType,t,"argument-error"),O(n.customData._serverResponse?.mfaPendingCredential,t,"argument-error"),Fl._fromError(t,n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ff(r,e){return fe(r,"POST","/v2/accounts/mfaEnrollment:start",de(r,e))}function Sb(r,e){return fe(r,"POST","/v2/accounts/mfaEnrollment:finalize",de(r,e))}function bb(r,e){return fe(r,"POST","/v2/accounts/mfaEnrollment:start",de(r,e))}function Pb(r,e){return fe(r,"POST","/v2/accounts/mfaEnrollment:finalize",de(r,e))}function Cb(r,e){return fe(r,"POST","/v2/accounts/mfaEnrollment:withdraw",de(r,e))}class Ul{constructor(e){this.user=e,this.enrolledFactors=[],e._onReload(t=>{t.mfaInfo&&(this.enrolledFactors=t.mfaInfo.map(n=>Gs._fromServerResponse(e.auth,n)))})}static _fromUser(e){return new Ul(e)}async getSession(){return jn._fromIdtoken(await this.user.getIdToken(),this.user)}async enroll(e,t){const n=e,i=await this.getSession(),s=await Lt(this.user,n._process(this.user.auth,i,t));return await this.user._updateTokensIfNecessary(s),this.user.reload()}async unenroll(e){const t=typeof e=="string"?e:e.uid,n=await this.user.getIdToken();try{const i=await Lt(this.user,Cb(this.user.auth,{idToken:n,mfaEnrollmentId:t}));this.enrolledFactors=this.enrolledFactors.filter(({uid:s})=>s!==t),await this.user._updateTokensIfNecessary(i),await this.user.reload()}catch(i){throw i}}}const Ac=new WeakMap;function Db(r){const e=z(r);return Ac.has(e)||Ac.set(e,Ul._fromUser(e)),Ac.get(e)}const Zo="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ey{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(Zo,"1"),this.storage.removeItem(Zo),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kb=1e3,Vb=10;class ty extends ey{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=N_(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const n=this.storage.getItem(t),i=this.localCache[t];n!==i&&e(t,i,n)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,c,u)=>{this.notifyListeners(o,u)});return}const n=e.key;t?this.detachListener():this.stopPolling();const i=()=>{const o=this.storage.getItem(n);!t&&this.localCache[n]===o||this.notifyListeners(n,o)},s=this.storage.getItem(n);nS()&&s!==e.newValue&&e.newValue!==e.oldValue?setTimeout(i,Vb):i()}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const i of Array.from(n))i(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,n)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:n}),!0)})},kb)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}ty.type="LOCAL";const ny=ty;/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nb=1e3;function Rc(r){const e=r.replace(/[\\^$.*+?()[\]{}|]/g,"\\$&"),t=RegExp(`${e}=([^;]+)`);return document.cookie.match(t)?.[1]??null}function Sc(r){return`${window.location.protocol==="http:"?"__dev_":"__HOST-"}FIREBASE_${r.split(":")[3]}`}class ry{constructor(){this.type="COOKIE",this.listenerUnsubscribes=new Map}_getFinalTarget(e){if(typeof window===void 0)return e;const t=new URL(`${window.location.origin}/__cookies__`);return t.searchParams.set("finalTarget",e),t}async _isAvailable(){return typeof isSecureContext=="boolean"&&!isSecureContext||typeof navigator>"u"||typeof document>"u"?!1:navigator.cookieEnabled??!0}async _set(e,t){}async _get(e){if(!this._isAvailable())return null;const t=Sc(e);return window.cookieStore?(await window.cookieStore.get(t))?.value:Rc(t)}async _remove(e){if(!this._isAvailable()||!await this._get(e))return;const n=Sc(e);document.cookie=`${n}=;Max-Age=34560000;Partitioned;Secure;SameSite=Strict;Path=/;Priority=High`,await fetch("/__cookies__",{method:"DELETE"}).catch(()=>{})}_addListener(e,t){if(!this._isAvailable())return;const n=Sc(e);if(window.cookieStore){const c=l=>{const f=l.changed.find(g=>g.name===n);f&&t(f.value),l.deleted.find(g=>g.name===n)&&t(null)},u=()=>window.cookieStore.removeEventListener("change",c);return this.listenerUnsubscribes.set(t,u),window.cookieStore.addEventListener("change",c)}let i=Rc(n);const s=setInterval(()=>{const c=Rc(n);c!==i&&(t(c),i=c)},Nb),o=()=>clearInterval(s);this.listenerUnsubscribes.set(t,o)}_removeListener(e,t){const n=this.listenerUnsubscribes.get(t);n&&(n(),this.listenerUnsubscribes.delete(t))}}ry.type="COOKIE";const Ob=ry;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class iy extends ey{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}iy.type="SESSION";const Bl=iy;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xb(r){return Promise.all(r.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oa{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(i=>i.isListeningto(e));if(t)return t;const n=new Oa(e);return this.receivers.push(n),n}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:n,eventType:i,data:s}=t.data,o=this.handlersMap[i];if(!o?.size)return;t.ports[0].postMessage({status:"ack",eventId:n,eventType:i});const c=Array.from(o).map(async l=>l(t.origin,s)),u=await xb(c);t.ports[0].postMessage({status:"done",eventId:n,eventType:i,response:u})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Oa.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xa(r="",e=10){let t="";for(let n=0;n<e;n++)t+=Math.floor(Math.random()*10);return r+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mb{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,n=50){const i=typeof MessageChannel<"u"?new MessageChannel:null;if(!i)throw new Error("connection_unavailable");let s,o;return new Promise((c,u)=>{const l=xa("",20);i.port1.start();const f=setTimeout(()=>{u(new Error("unsupported_event"))},n);o={messageChannel:i,onMessage(p){const g=p;if(g.data.eventId===l)switch(g.data.status){case"ack":clearTimeout(f),s=setTimeout(()=>{u(new Error("timeout"))},3e3);break;case"done":clearTimeout(s),c(g.data.response);break;default:clearTimeout(f),clearTimeout(s),u(new Error("invalid_response"));break}}},this.handlers.add(o),i.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:l,data:t},[i.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ae(){return window}function Lb(r){Ae().location.href=r}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ql(){return typeof Ae().WorkerGlobalScope<"u"&&typeof Ae().importScripts=="function"}async function Fb(){if(!navigator?.serviceWorker)return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Ub(){return navigator?.serviceWorker?.controller||null}function Bb(){return ql()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sy="firebaseLocalStorageDb",qb=1,ea="firebaseLocalStorage",oy="fbase_key";class $s{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Ma(r,e){return r.transaction([ea],e?"readwrite":"readonly").objectStore(ea)}function zb(){const r=indexedDB.deleteDatabase(sy);return new $s(r).toPromise()}function du(){const r=indexedDB.open(sy,qb);return new Promise((e,t)=>{r.addEventListener("error",()=>{t(r.error)}),r.addEventListener("upgradeneeded",()=>{const n=r.result;try{n.createObjectStore(ea,{keyPath:oy})}catch(i){t(i)}}),r.addEventListener("success",async()=>{const n=r.result;n.objectStoreNames.contains(ea)?e(n):(n.close(),await zb(),e(await du()))})})}async function Uf(r,e,t){const n=Ma(r,!0).put({[oy]:e,value:t});return new $s(n).toPromise()}async function jb(r,e){const t=Ma(r,!1).get(e),n=await new $s(t).toPromise();return n===void 0?null:n.value}function Bf(r,e){const t=Ma(r,!0).delete(e);return new $s(t).toPromise()}const Gb=800,$b=3;class ay{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await du(),this.db)}async _withRetries(e){let t=0;for(;;)try{const n=await this._openDb();return await e(n)}catch(n){if(t++>$b)throw n;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return ql()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Oa._getInstance(Bb()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){if(this.activeServiceWorker=await Fb(),!this.activeServiceWorker)return;this.sender=new Mb(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&e[0]?.fulfilled&&e[0]?.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Ub()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await du();return await Uf(e,Zo,"1"),await Bf(e,Zo),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(n=>Uf(n,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(n=>jb(n,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>Bf(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(i=>{const s=Ma(i,!1).getAll();return new $s(s).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],n=new Set;if(e.length!==0)for(const{fbase_key:i,value:s}of e)n.add(i),JSON.stringify(this.localCache[i])!==JSON.stringify(s)&&(this.notifyListeners(i,s),t.push(i));for(const i of Object.keys(this.localCache))this.localCache[i]&&!n.has(i)&&(this.notifyListeners(i,null),t.push(i));return t}notifyListeners(e,t){this.localCache[e]=t;const n=this.listeners[e];if(n)for(const i of Array.from(n))i(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Gb)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}ay.type="LOCAL";const cy=ay;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function qf(r,e){return fe(r,"POST","/v2/accounts/mfaSignIn:start",de(r,e))}function Kb(r,e){return fe(r,"POST","/v2/accounts/mfaSignIn:finalize",de(r,e))}function Wb(r,e){return fe(r,"POST","/v2/accounts/mfaSignIn:finalize",de(r,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bc=x_("rcb"),Hb=new zs(3e4,6e4);class Qb{constructor(){this.hostLanguage="",this.counter=0,this.librarySeparatelyLoaded=!!Ae().grecaptcha?.render}load(e,t=""){return O(Jb(t),e,"argument-error"),this.shouldResolveImmediately(t)&&Cf(Ae().grecaptcha)?Promise.resolve(Ae().grecaptcha):new Promise((n,i)=>{const s=Ae().setTimeout(()=>{i(Ge(e,"network-request-failed"))},Hb.get());Ae()[bc]=()=>{Ae().clearTimeout(s),delete Ae()[bc];const c=Ae().grecaptcha;if(!c||!Cf(c)){i(Ge(e,"internal-error"));return}const u=c.render;c.render=(l,f)=>{const p=u(l,f);return this.counter++,p},this.hostLanguage=t,n(c)};const o=`${uS()}?${ti({onload:bc,render:"explicit",hl:t})}`;Nl(o).catch(()=>{clearTimeout(s),i(Ge(e,"internal-error"))})})}clearedOneInstance(){this.counter--}shouldResolveImmediately(e){return!!Ae().grecaptcha?.render&&(e===this.hostLanguage||this.counter>0||this.librarySeparatelyLoaded)}}function Jb(r){return r.length<=6&&/^\s*[a-zA-Z0-9\-]*\s*$/.test(r)}class Yb{async load(e){return new pS(e)}clearedOneInstance(){}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const as="recaptcha",Xb={theme:"light",type:"image"};class Zb{constructor(e,t,n={...Xb}){this.parameters=n,this.type=as,this.destroyed=!1,this.widgetId=null,this.tokenChangeListeners=new Set,this.renderPromise=null,this.recaptcha=null,this.auth=Ee(e),this.isInvisible=this.parameters.size==="invisible",O(typeof document<"u",this.auth,"operation-not-supported-in-this-environment");const i=typeof t=="string"?document.getElementById(t):t;O(i,this.auth,"argument-error"),this.container=i,this.parameters.callback=this.makeTokenCallback(this.parameters.callback),this._recaptchaLoader=this.auth.settings.appVerificationDisabledForTesting?new Yb:new Qb,this.validateStartingState()}async verify(){this.assertNotDestroyed();const e=await this.render(),t=this.getAssertedRecaptcha(),n=t.getResponse(e);return n||new Promise(i=>{const s=o=>{o&&(this.tokenChangeListeners.delete(s),i(o))};this.tokenChangeListeners.add(s),this.isInvisible&&t.execute(e)})}render(){try{this.assertNotDestroyed()}catch(e){return Promise.reject(e)}return this.renderPromise?this.renderPromise:(this.renderPromise=this.makeRenderPromise().catch(e=>{throw this.renderPromise=null,e}),this.renderPromise)}_reset(){this.assertNotDestroyed(),this.widgetId!==null&&this.getAssertedRecaptcha().reset(this.widgetId)}clear(){this.assertNotDestroyed(),this.destroyed=!0,this._recaptchaLoader.clearedOneInstance(),this.isInvisible||this.container.childNodes.forEach(e=>{this.container.removeChild(e)})}validateStartingState(){O(!this.parameters.sitekey,this.auth,"argument-error"),O(this.isInvisible||!this.container.hasChildNodes(),this.auth,"argument-error"),O(typeof document<"u",this.auth,"operation-not-supported-in-this-environment")}makeTokenCallback(e){return t=>{if(this.tokenChangeListeners.forEach(n=>n(t)),typeof e=="function")e(t);else if(typeof e=="string"){const n=Ae()[e];typeof n=="function"&&n(t)}}}assertNotDestroyed(){O(!this.destroyed,this.auth,"internal-error")}async makeRenderPromise(){if(await this.init(),!this.widgetId){let e=this.container;if(!this.isInvisible){const t=document.createElement("div");e.appendChild(t),e=t}this.widgetId=this.getAssertedRecaptcha().render(e,this.parameters)}return this.widgetId}async init(){O(Dl()&&!ql(),this.auth,"internal-error"),await eP(),this.recaptcha=await this._recaptchaLoader.load(this.auth,this.auth.languageCode||void 0);const e=await KR(this.auth);O(e,this.auth,"internal-error"),this.parameters.sitekey=e}getAssertedRecaptcha(){return O(this.recaptcha,this.auth,"internal-error"),this.recaptcha}}function eP(){let r=null;return new Promise(e=>{if(document.readyState==="complete"){e();return}r=()=>e(),window.addEventListener("load",r)}).catch(e=>{throw r&&window.removeEventListener("load",r),e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zl{constructor(e,t){this.verificationId=e,this.onConfirmation=t}confirm(e){const t=un._fromVerification(this.verificationId,e);return this.onConfirmation(t)}}async function tP(r,e,t){if(me(r.app))return Promise.reject(Oe(r));const n=Ee(r),i=await La(n,e,z(t));return new zl(i,s=>Va(n,s))}async function nP(r,e,t){const n=z(r);await ka(!1,n,"phone");const i=await La(n.auth,e,z(t));return new zl(i,s=>W_(n,s))}async function rP(r,e,t){const n=z(r);if(me(n.auth.app))return Promise.reject(Oe(n.auth));const i=await La(n.auth,e,z(t));return new zl(i,s=>H_(n,s))}async function La(r,e,t){if(!r._getRecaptchaConfig())try{await L_(r)}catch{console.log("Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.")}try{let n;if(typeof e=="string"?n={phoneNumber:e}:n=e,"session"in n){const i=n.session;if("phoneNumber"in n){O(i.type==="enroll",r,"internal-error");const s={idToken:i.credential,phoneEnrollmentInfo:{phoneNumber:n.phoneNumber,clientType:"CLIENT_TYPE_WEB"}};return(await cn(r,s,"mfaSmsEnrollment",async(l,f)=>{if(f.phoneEnrollmentInfo.captchaResponse===ss){O(t?.type===as,l,"argument-error");const p=await Pc(l,f,t);return Ff(l,p)}return Ff(l,f)},"PHONE_PROVIDER").catch(l=>Promise.reject(l))).phoneSessionInfo.sessionInfo}else{O(i.type==="signin",r,"internal-error");const s=n.multiFactorHint?.uid||n.multiFactorUid;O(s,r,"missing-multi-factor-info");const o={mfaPendingCredential:i.credential,mfaEnrollmentId:s,phoneSignInInfo:{clientType:"CLIENT_TYPE_WEB"}};return(await cn(r,o,"mfaSmsSignIn",async(f,p)=>{if(p.phoneSignInInfo.captchaResponse===ss){O(t?.type===as,f,"argument-error");const g=await Pc(f,p,t);return qf(f,g)}return qf(f,p)},"PHONE_PROVIDER").catch(f=>Promise.reject(f))).phoneResponseInfo.sessionInfo}}else{const i={phoneNumber:n.phoneNumber,clientType:"CLIENT_TYPE_WEB"};return(await cn(r,i,"sendVerificationCode",async(u,l)=>{if(l.captchaResponse===ss){O(t?.type===as,u,"argument-error");const f=await Pc(u,l,t);return Mf(u,f)}return Mf(u,l)},"PHONE_PROVIDER").catch(u=>Promise.reject(u))).sessionInfo}}finally{t?._reset()}}async function iP(r,e){const t=z(r);if(me(t.auth.app))return Promise.reject(Oe(t.auth));await Ol(t,e)}async function Pc(r,e,t){O(t.type===as,r,"argument-error");const n=await t.verify();O(typeof n=="string",r,"argument-error");const i={...e};if("phoneEnrollmentInfo"in i){const s=i.phoneEnrollmentInfo.phoneNumber,o=i.phoneEnrollmentInfo.captchaResponse,c=i.phoneEnrollmentInfo.clientType,u=i.phoneEnrollmentInfo.recaptchaVersion;return Object.assign(i,{phoneEnrollmentInfo:{phoneNumber:s,recaptchaToken:n,captchaResponse:o,clientType:c,recaptchaVersion:u}}),i}else if("phoneSignInInfo"in i){const s=i.phoneSignInInfo.captchaResponse,o=i.phoneSignInInfo.clientType,c=i.phoneSignInInfo.recaptchaVersion;return Object.assign(i,{phoneSignInInfo:{recaptchaToken:n,captchaResponse:s,clientType:o,recaptchaVersion:c}}),i}else return Object.assign(i,{recaptchaToken:n}),i}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wn{constructor(e){this.providerId=Wn.PROVIDER_ID,this.auth=Ee(e)}verifyPhoneNumber(e,t){return La(this.auth,e,z(t))}static credential(e,t){return un._fromVerification(e,t)}static credentialFromResult(e){const t=e;return Wn.credentialFromTaggedObject(t)}static credentialFromError(e){return Wn.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{phoneNumber:t,temporaryProof:n}=e;return t&&n?un._fromTokenResponse(t,n):null}}Wn.PROVIDER_ID="phone";Wn.PHONE_SIGN_IN_METHOD="phone";/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function dr(r,e){return e?Dt(e):(O(r._popupRedirectResolver,r,"argument-error"),r._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jl extends gi{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return Vt(e,this._buildIdpRequest())}_linkToIdToken(e,t){return Vt(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return Vt(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function sP(r){return K_(r.auth,new jl(r),r.bypassAuthState)}function oP(r){const{auth:e,user:t}=r;return O(t,e,"internal-error"),$_(t,new jl(r),r.bypassAuthState)}async function aP(r){const{auth:e,user:t}=r;return O(t,e,"internal-error"),Ol(t,new jl(r),r.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uy{constructor(e,t,n,i,s=!1){this.auth=e,this.resolver=n,this.user=i,this.bypassAuthState=s,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(n){this.reject(n)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:n,postBody:i,tenantId:s,error:o,type:c}=e;if(o){this.reject(o);return}const u={auth:this.auth,requestUri:t,sessionId:n,tenantId:s||void 0,postBody:i||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(c)(u))}catch(l){this.reject(l)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return sP;case"linkViaPopup":case"linkViaRedirect":return aP;case"reauthViaPopup":case"reauthViaRedirect":return oP;default:Xe(this.auth,"internal-error")}}resolve(e){Mt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){Mt(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const cP=new zs(2e3,1e4);async function uP(r,e,t){if(me(r.app))return Promise.reject(Ge(r,"operation-not-supported-in-this-environment"));const n=Ee(r);mi(r,e,jt);const i=dr(n,t);return new kt(n,"signInViaPopup",e,i).executeNotNull()}async function lP(r,e,t){const n=z(r);if(me(n.auth.app))return Promise.reject(Ge(n.auth,"operation-not-supported-in-this-environment"));mi(n.auth,e,jt);const i=dr(n.auth,t);return new kt(n.auth,"reauthViaPopup",e,i,n).executeNotNull()}async function hP(r,e,t){const n=z(r);mi(n.auth,e,jt);const i=dr(n.auth,t);return new kt(n.auth,"linkViaPopup",e,i,n).executeNotNull()}class kt extends uy{constructor(e,t,n,i,s){super(e,t,i,s),this.provider=n,this.authWindow=null,this.pollId=null,kt.currentPopupAction&&kt.currentPopupAction.cancel(),kt.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return O(e,this.auth,"internal-error"),e}async onExecution(){Mt(this.filter.length===1,"Popup operations only handle one event");const e=xa();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(Ge(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){return this.authWindow?.associatedEvent||null}cancel(){this.reject(Ge(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,kt.currentPopupAction=null}pollUserCancellation(){const e=()=>{if(this.authWindow?.window?.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(Ge(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,cP.get())};e()}}kt.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dP="pendingRedirect",Do=new Map;class fP extends uy{constructor(e,t,n=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,n),this.eventId=null}async execute(){let e=Do.get(this.auth._key());if(!e){try{const n=await pP(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(n)}catch(t){e=()=>Promise.reject(t)}Do.set(this.auth._key(),e)}return this.bypassAuthState||Do.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function pP(r,e){const t=hy(e),n=ly(r);if(!await n._isAvailable())return!1;const i=await n._get(t)==="true";return await n._remove(t),i}async function Gl(r,e){return ly(r)._set(hy(e),"true")}function mP(r,e){Do.set(r._key(),e)}function ly(r){return Dt(r._redirectPersistence)}function hy(r){return Co(dP,r.config.apiKey,r.name)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gP(r,e,t){return _P(r,e,t)}async function _P(r,e,t){if(me(r.app))return Promise.reject(Oe(r));const n=Ee(r);mi(r,e,jt),await n._initializationPromise;const i=dr(n,t);return await Gl(i,n),i._openRedirect(n,e,"signInViaRedirect")}function yP(r,e,t){return IP(r,e,t)}async function IP(r,e,t){const n=z(r);if(mi(n.auth,e,jt),me(n.auth.app))return Promise.reject(Oe(n.auth));await n.auth._initializationPromise;const i=dr(n.auth,t);await Gl(i,n.auth);const s=await fy(n);return i._openRedirect(n.auth,e,"reauthViaRedirect",s)}function EP(r,e,t){return TP(r,e,t)}async function TP(r,e,t){const n=z(r);mi(n.auth,e,jt),await n.auth._initializationPromise;const i=dr(n.auth,t);await ka(!1,n,e.providerId),await Gl(i,n.auth);const s=await fy(n);return i._openRedirect(n.auth,e,"linkViaRedirect",s)}async function wP(r,e){return await Ee(r)._initializationPromise,dy(r,e,!1)}async function dy(r,e,t=!1){if(me(r.app))return Promise.reject(Oe(r));const n=Ee(r),i=dr(n,e),o=await new fP(n,i,t).execute();return o&&!t&&(delete o.user._redirectEventId,await n._persistUserIfCurrent(o.user),await n._setRedirectUser(null,e)),o}async function fy(r){const e=xa(`${r.uid}:::`);return r._redirectEventId=e,await r.auth._setRedirectUser(r),await r.auth._persistUserIfCurrent(r),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vP=10*60*1e3;class AP{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(n=>{this.isEventForConsumer(e,n)&&(t=!0,this.sendToConsumer(e,n),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!RP(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){if(e.error&&!py(e)){const n=e.error.code?.split("auth/")[1]||"internal-error";t.onError(Ge(this.auth,n))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const n=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&n}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=vP&&this.cachedEventUids.clear(),this.cachedEventUids.has(zf(e))}saveEventToCache(e){this.cachedEventUids.add(zf(e)),this.lastProcessedEventTime=Date.now()}}function zf(r){return[r.type,r.eventId,r.sessionId,r.tenantId].filter(e=>e).join("-")}function py({type:r,error:e}){return r==="unknown"&&e?.code==="auth/no-auth-event"}function RP(r){switch(r.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return py(r);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function SP(r,e={}){return fe(r,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bP=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,PP=/^https?/;async function CP(r){if(r.config.emulator)return;const{authorizedDomains:e}=await SP(r);for(const t of e)try{if(DP(t))return}catch{}Xe(r,"unauthorized-domain")}function DP(r){const e=vs(),{protocol:t,hostname:n}=new URL(e);if(r.startsWith("chrome-extension://")){const o=new URL(r);return o.hostname===""&&n===""?t==="chrome-extension:"&&r.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===n}if(!PP.test(t))return!1;if(bP.test(r))return n===r;const i=r.replace(/\./g,"\\.");return new RegExp("^(.+\\."+i+"|"+i+")$","i").test(n)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kP=new zs(3e4,6e4);function jf(){const r=Ae().___jsl;if(r?.H){for(const e of Object.keys(r.H))if(r.H[e].r=r.H[e].r||[],r.H[e].L=r.H[e].L||[],r.H[e].r=[...r.H[e].L],r.CP)for(let t=0;t<r.CP.length;t++)r.CP[t]=null}}function VP(r){return new Promise((e,t)=>{function n(){jf(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{jf(),t(Ge(r,"network-request-failed"))},timeout:kP.get()})}if(Ae().gapi?.iframes?.Iframe)e(gapi.iframes.getContext());else if(Ae().gapi?.load)n();else{const i=x_("iframefcb");return Ae()[i]=()=>{gapi.load?n():t(Ge(r,"network-request-failed"))},Nl(`${hS()}?onload=${i}`).catch(s=>t(s))}}).catch(e=>{throw ko=null,e})}let ko=null;function NP(r){return ko=ko||VP(r),ko}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const OP=new zs(5e3,15e3),xP="__/auth/iframe",MP="emulator/auth/iframe",LP={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},FP=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function UP(r){const e=r.config;O(e.authDomain,r,"auth-domain-config-required");const t=e.emulator?kl(e,MP):`https://${r.config.authDomain}/${xP}`,n={apiKey:e.apiKey,appName:r.name,v:or},i=FP.get(r.config.apiHost);i&&(n.eid=i);const s=r._getFrameworks();return s.length&&(n.fw=s.join(",")),`${t}?${ti(n).slice(1)}`}async function BP(r){const e=await NP(r),t=Ae().gapi;return O(t,r,"internal-error"),e.open({where:document.body,url:UP(r),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:LP,dontclear:!0},n=>new Promise(async(i,s)=>{await n.restyle({setHideOnLeave:!1});const o=Ge(r,"network-request-failed"),c=Ae().setTimeout(()=>{s(o)},OP.get());function u(){Ae().clearTimeout(c),i(n)}n.ping(u).then(u,()=>{s(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qP={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},zP=500,jP=600,GP="_blank",$P="http://localhost";class Gf{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function KP(r,e,t,n=zP,i=jP){const s=Math.max((window.screen.availHeight-i)/2,0).toString(),o=Math.max((window.screen.availWidth-n)/2,0).toString();let c="";const u={...qP,width:n.toString(),height:i.toString(),top:s,left:o},l=be().toLowerCase();t&&(c=P_(l)?GP:t),S_(l)&&(e=e||$P,u.scrollbars="yes");const f=Object.entries(u).reduce((g,[v,D])=>`${g}${v}=${D},`,"");if(tS(l)&&c!=="_self")return WP(e||"",c),new Gf(null);const p=window.open(e||"",c,f);O(p,r,"popup-blocked");try{p.focus()}catch{}return new Gf(p)}function WP(r,e){const t=document.createElement("a");t.href=r,t.target=e;const n=document.createEvent("MouseEvent");n.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const HP="__/auth/handler",QP="emulator/auth/handler",JP=encodeURIComponent("fac");async function $f(r,e,t,n,i,s){O(r.config.authDomain,r,"auth-domain-config-required"),O(r.config.apiKey,r,"invalid-api-key");const o={apiKey:r.config.apiKey,appName:r.name,authType:t,redirectUrl:n,v:or,eventId:i};if(e instanceof jt){e.setDefaultLanguage(r.languageCode),o.providerId=e.providerId||"",II(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[f,p]of Object.entries({}))o[f]=p}if(e instanceof yi){const f=e.getScopes().filter(p=>p!=="");f.length>0&&(o.scopes=f.join(","))}r.tenantId&&(o.tid=r.tenantId);const c=o;for(const f of Object.keys(c))c[f]===void 0&&delete c[f];const u=await r._getAppCheckToken(),l=u?`#${JP}=${encodeURIComponent(u)}`:"";return`${YP(r)}?${ti(c).slice(1)}${l}`}function YP({config:r}){return r.emulator?kl(r,QP):`https://${r.authDomain}/${HP}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Cc="webStorageSupport";class XP{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Bl,this._completeRedirectFn=dy,this._overrideRedirectResult=mP}async _openPopup(e,t,n,i){Mt(this.eventManagers[e._key()]?.manager,"_initialize() not called before _openPopup()");const s=await $f(e,t,n,vs(),i);return KP(e,s,xa())}async _openRedirect(e,t,n,i){await this._originValidation(e);const s=await $f(e,t,n,vs(),i);return Lb(s),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:i,promise:s}=this.eventManagers[t];return i?Promise.resolve(i):(Mt(s,"If manager is not set, promise should be"),s)}const n=this.initAndGetManager(e);return this.eventManagers[t]={promise:n},n.catch(()=>{delete this.eventManagers[t]}),n}async initAndGetManager(e){const t=await BP(e),n=new AP(e);return t.register("authEvent",i=>(O(i?.authEvent,e,"invalid-auth-event"),{status:n.onEvent(i.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:n},this.iframes[e._key()]=t,n}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Cc,{type:Cc},i=>{const s=i?.[0]?.[Cc];s!==void 0&&t(!!s),Xe(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=CP(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return N_()||b_()||Vl()}}const my=XP;class gy{constructor(e){this.factorId=e}_process(e,t,n){switch(t.type){case"enroll":return this._finalizeEnroll(e,t.credential,n);case"signin":return this._finalizeSignIn(e,t.credential);default:return _t("unexpected MultiFactorSessionType")}}}class $l extends gy{constructor(e){super("phone"),this.credential=e}static _fromCredential(e){return new $l(e)}_finalizeEnroll(e,t,n){return Sb(e,{idToken:t,displayName:n,phoneVerificationInfo:this.credential._makeVerificationRequest()})}_finalizeSignIn(e,t){return Kb(e,{mfaPendingCredential:t,phoneVerificationInfo:this.credential._makeVerificationRequest()})}}class _y{constructor(){}static assertion(e){return $l._fromCredential(e)}}_y.FACTOR_ID="phone";class yy{static assertionForEnrollment(e,t){return Ss._fromSecret(e,t)}static assertionForSignIn(e,t){return Ss._fromEnrollmentId(e,t)}static async generateSecret(e){const t=e;O(typeof t.user?.auth<"u","internal-error");const n=await bb(t.user.auth,{idToken:t.credential,totpEnrollmentInfo:{}});return Fa._fromStartTotpMfaEnrollmentResponse(n,t.user.auth)}}yy.FACTOR_ID="totp";class Ss extends gy{constructor(e,t,n){super("totp"),this.otp=e,this.enrollmentId=t,this.secret=n}static _fromSecret(e,t){return new Ss(t,void 0,e)}static _fromEnrollmentId(e,t){return new Ss(t,e)}async _finalizeEnroll(e,t,n){return O(typeof this.secret<"u",e,"argument-error"),Pb(e,{idToken:t,displayName:n,totpVerificationInfo:this.secret._makeTotpVerificationInfo(this.otp)})}async _finalizeSignIn(e,t){O(this.enrollmentId!==void 0&&this.otp!==void 0,e,"argument-error");const n={verificationCode:this.otp};return Wb(e,{mfaPendingCredential:t,mfaEnrollmentId:this.enrollmentId,totpVerificationInfo:n})}}class Fa{constructor(e,t,n,i,s,o,c){this.sessionInfo=o,this.auth=c,this.secretKey=e,this.hashingAlgorithm=t,this.codeLength=n,this.codeIntervalSeconds=i,this.enrollmentCompletionDeadline=s}static _fromStartTotpMfaEnrollmentResponse(e,t){return new Fa(e.totpSessionInfo.sharedSecretKey,e.totpSessionInfo.hashingAlgorithm,e.totpSessionInfo.verificationCodeLength,e.totpSessionInfo.periodSec,new Date(e.totpSessionInfo.finalizeEnrollmentTime).toUTCString(),e.totpSessionInfo.sessionInfo,t)}_makeTotpVerificationInfo(e){return{sessionInfo:this.sessionInfo,verificationCode:e}}generateQrCodeUrl(e,t){let n=!1;return(_o(e)||_o(t))&&(n=!0),n&&(_o(e)&&(e=this.auth.currentUser?.email||"unknownuser"),_o(t)&&(t=this.auth.name)),`otpauth://totp/${t}:${e}?secret=${this.secretKey}&issuer=${t}&algorithm=${this.hashingAlgorithm}&digits=${this.codeLength}`}}function _o(r){return typeof r>"u"||r?.length===0}var Kf="@firebase/auth",Wf="1.11.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ZP{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){return this.assertAuthConfigured(),this.auth.currentUser?.uid||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(n=>{e(n?.stsTokenManager.accessToken||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){O(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eC(r){switch(r){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function tC(r){Qn(new Hn("auth",(e,{options:t})=>{const n=e.getProvider("app").getImmediate(),i=e.getProvider("heartbeat"),s=e.getProvider("app-check-internal"),{apiKey:o,authDomain:c}=n.options;O(o&&!o.includes(":"),"invalid-api-key",{appName:n.name});const u={apiKey:o,authDomain:c,clientPlatform:r,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:O_(r)},l=new aS(n,i,s,u);return ES(l,t),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,n)=>{e.getProvider("auth-internal").initialize()})),Qn(new Hn("auth-internal",e=>{const t=Ee(e.getProvider("auth").getImmediate());return(n=>new ZP(n))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),yt(Kf,Wf,eC(r)),yt(Kf,Wf,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nC=5*60,rC=Zf("authIdTokenMaxAge")||nC;let Hf=null;const iC=r=>async e=>{const t=e&&await e.getIdTokenResult(),n=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(n&&n>rC)return;const i=t?.token;Hf!==i&&(Hf=i,await fetch(r,{method:i?"POST":"DELETE",headers:i?{Authorization:`Bearer ${i}`}:{}}))};function sC(r=Eu()){const e=ni(r,"auth");if(e.isInitialized())return e.getImmediate();const t=F_(r,{popupRedirectResolver:my,persistence:[cy,ny,Bl]}),n=Zf("authTokenSyncURL");if(n&&typeof isSecureContext=="boolean"&&isSecureContext){const s=new URL(n,location.origin);if(location.origin===s.origin){const o=iC(s.toString());Z_(t,o,()=>o(t.currentUser)),X_(t,c=>o(c))}}const i=Xf("auth");return i&&U_(t,`http://${i}`),t}function oC(){return document.getElementsByTagName("head")?.[0]??document}cS({loadJS(r){return new Promise((e,t)=>{const n=document.createElement("script");n.setAttribute("src",r),n.onload=e,n.onerror=i=>{const s=Ge("internal-error");s.customData=i,t(s)},n.type="text/javascript",n.charset="UTF-8",oC().appendChild(n)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});tC("Browser");const lC=Object.freeze(Object.defineProperty({__proto__:null,ActionCodeOperation:OR,ActionCodeURL:_i,AuthCredential:gi,AuthErrorCodes:LR,EmailAuthCredential:ei,EmailAuthProvider:bn,FacebookAuthProvider:At,FactorId:DR,GithubAuthProvider:St,GoogleAuthProvider:Rt,OAuthCredential:wt,OAuthProvider:os,OperationType:NR,PhoneAuthCredential:un,PhoneAuthProvider:Wn,PhoneMultiFactorGenerator:_y,ProviderId:kR,RecaptchaVerifier:Zb,SAMLAuthProvider:Yo,SignInMethod:VR,TotpMultiFactorGenerator:yy,TotpSecret:Fa,TwitterAuthProvider:bt,applyActionCode:QS,beforeAuthStateChanged:Z_,browserCookiePersistence:Ob,browserLocalPersistence:ny,browserPopupRedirectResolver:my,browserSessionPersistence:Bl,checkActionCode:Q_,confirmPasswordReset:HS,connectAuthEmulator:U_,createUserWithEmailAndPassword:YS,debugErrorMap:MR,deleteUser:Ab,fetchSignInMethodsForEmail:rb,getAdditionalUserInfo:mb,getAuth:sC,getIdToken:QR,getIdTokenResult:w_,getMultiFactorResolver:Rb,getRedirectResult:wP,inMemoryPersistence:hu,indexedDBLocalPersistence:cy,initializeAuth:F_,initializeRecaptchaConfig:_b,isSignInWithEmailLink:eb,linkWithCredential:W_,linkWithPhoneNumber:nP,linkWithPopup:hP,linkWithRedirect:EP,multiFactor:Db,onAuthStateChanged:Ib,onIdTokenChanged:X_,parseActionCodeURL:BS,prodErrorMap:m_,reauthenticateWithCredential:H_,reauthenticateWithPhoneNumber:rP,reauthenticateWithPopup:lP,reauthenticateWithRedirect:yP,reload:v_,revokeAccessToken:vb,sendEmailVerification:ib,sendPasswordResetEmail:WS,sendSignInLinkToEmail:ZS,setPersistence:gb,signInAnonymously:jS,signInWithCredential:Va,signInWithCustomToken:KS,signInWithEmailAndPassword:XS,signInWithEmailLink:tb,signInWithPhoneNumber:tP,signInWithPopup:uP,signInWithRedirect:gP,signOut:wb,unlink:GS,updateCurrentUser:Tb,updateEmail:cb,updatePassword:ub,updatePhoneNumber:iP,updateProfile:ab,useDeviceLanguage:Eb,validatePassword:yb,verifyBeforeUpdateEmail:sb,verifyPasswordResetCode:JS},Symbol.toStringTag,{value:"Module"}));export{uC as A,lC as B,Rt as G,ne as T,sC as a,YA as b,iA as c,$A as d,X_ as e,uu as f,uA as g,XS as h,fp as i,uP as j,WS as k,PA as l,YS as m,jg as n,bA as o,zA as p,vA as q,QA as r,gR as s,JA as t,ab as u,eR as v,AA as w,kA as x,TR as y,aC as z};
