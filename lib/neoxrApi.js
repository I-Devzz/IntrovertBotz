module.exports = class NeoxrApi {
   baseUrl = 'https://api.neoxr.eu/api'
   apiKey = null

   constructor(apiKey) {
      this.apiKey = apiKey || ''
   }
   
   check = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/check/' + this.apiKey)
      return json
   }
   
   podcast = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/podcast?url=' + url + '&apikey=' + this.apiKey)
      return json
   }
   
   fb = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/fb?url=' + encodeURIComponent(url) + '&apikey=' + this.apiKey)
      return json
   }

   ig = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/ig?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   igs = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/igstory?url=' + url + '&apikey=' + this.apiKey)
      return json
   }
   
   igh = async (str) => {
      let json = await Func.fetchJson(this.baseUrl + '/igh?url=' + str + '&apikey=' + this.apiKey)
      return json
   }
   
   line = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/line?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   pin = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/pin?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   mediafire = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/mediafire?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   tiktok = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/tiktok?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   twitter = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/twitter?url=' + url + '&apikey=' + this.apiKey)
      return json
   }

   soundcloud = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/soundcloud?url=' + url + '&apikey=' + this.apiKey)
      return json
   }
   
   rexdl = async (str) => {
      let json = str.match('rexdl.com') ? await Func.fetchJson(this.baseUrl + '/rexdl-get?url=' + str + '&apikey=' + this.apiKey) : await Func.fetchJson(this.baseUrl + '/rexdl?q=' + encodeURIComponent(str) + '&apikey=' + this.apiKey)
      return json
   }
   
   pinterest = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/pinterest?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   soundcloud = async (str) => {
      let json = str.match('soundcloud.com') ? await Func.fetchJson(this.baseUrl + '/soundcloud?url=' + str + '&apikey=' + this.apiKey) : await Func.fetchJson(this.baseUrl + '/soundcloud-search?q=' + str + '&apikey=' + this.apiKey)
      return json
   }
   
   apk = async (query, no) => {
      if (query && no) {
         let json = await Func.fetchJson(this.baseUrl + '/apk?q=' + query + '&no=' + no + '&apikey=' + this.apiKey)
         return json
      } else if (query) {
         let json = await Func.fetchJson(this.baseUrl + '/apk?q=' + query + '&apikey=' + this.apiKey)
         return json
      }
   }
   
   emojimix = async (emoticon) => {
  	let json = await Func.fetchJson(this.baseUrl + '/emoji?q=' + encodeURI(emoticon) + '&apikey=' + this.apiKey)
      return json
   }
   
   wallpaper = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/wallpaper2?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   sticker = async (str) => {
      let json = str.match('getstickerpack.com') ? await Func.fetchJson(this.baseUrl + '/sticker-get?url=' + str + '&apikey=' + this.apiKey) : await Func.fetchJson(this.baseUrl + '/sticker?q=' + encodeURIComponent(str) + '&apikey=' + this.apiKey)
      return json
   }
   
   tm = (style, text) => {  
      return this.baseUrl + '/' + style + '?text=' + text + '&apikey=' + this.apiKey
   }
   
   ie = (style, image) => {
      return this.baseUrl + '/effect?style=' + style + '&image=' + image + '&apikey=' + this.apiKey
   }
   
   ie2 = (style, image) => {
      return this.baseUrl + '/effect2?style=' + style + '&image=' + image + '&apikey=' + this.apiKey
   }
   
   nobg = async (image) => {
      let json = await Func.fetchJson(this.baseUrl + '/nobg3?image=' + image + '&apikey=' + this.apiKey)
      return json
   }
   
   ocr = async (image) => {
      let json = await Func.fetchJson(this.baseUrl + '/ocr?image=' + image + '&apikey=' + this.apiKey)
      return json
   }
   
   brainly = async (query, lang) => {
  	let json = await Func.fetchJson(this.baseUrl + '/brainly?q=' + query + '&iso=' + lang + '&apikey=' + this.apiKey)
      return json
   }
   
   sholat = async (city) => {
      let json = await Func.fetchJson(this.baseUrl + '/sholat?q=' + city + '&apikey=' + this.apiKey)
      return json
   }
   
   kbbg = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/kbbg?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   chord = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/chord?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   lyric = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/lyric?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   igstalk = async (username) => {
      let json = await Func.fetchJson(this.baseUrl + '/igstalk?username=' + username + '&apikey=' + this.apiKey)
      return json
   }
   
   google = async (query, image = false) => {
      let json = await Func.fetchJson(this.baseUrl + '/' + (image ? 'goimg' : 'google') + '?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   nama = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/artinama?nama=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   cerpen = async (category) => {
      let json = await Func.fetchJson(this.baseUrl + '/cerpen?category=' + category + '&apikey=' + this.apiKey)
      return json
   }

   cerpenList = async (category) => {
      let json = await Func.fetchJson(this.baseUrl + '/cerpen-list?category=' + category + '&apikey=' + this.apiKey)
      return json
   }
   
   cerpenFetch = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/cerpen-get?url=' + url + '&apikey=' + this.apiKey)
      return json
   }
   
   cnn = async (url) => {
      let json = url ? await Func.fetchJson(this.baseUrl + '/cnn?url=' + url + '&apikey=' + this.apiKey) : await Func.fetchJson(this.baseUrl + '/cnn?apikey=' + this.apiKey)
      return json
   }
   
   gempa = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/gempa?apikey=' + this.apiKey)
      return json
   }
   
   asahotak = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/asahotak?apikey=' + this.apiKey)
      return json
   }
   
   whoami = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/whoami?apikey=' + this.apiKey)
      return json
   }
   
   whatword = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/whatword?apikey=' + this.apiKey)
      return json
   }
   
   whatflag = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/whatflag?apikey=' + this.apiKey)
      return json
   }
   
   whatsong = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/whatsong?apikey=' + this.apiKey)
      return json
   }
   
   tekateki = async () => {
      let json = await Func.fetchJson(this.baseUrl + '/tekateki?apikey=' + this.apiKey)
      return json
   }
   
   toAnime = async url => {
      let json = await Func.fetchJson('https://qq.indocoder.dev/?url=' + url)
      return json
   }
   
   spotify = async (str) => {
      let json = str.startsWith('https') ? await Func.fetchJson(this.baseUrl + '/spotify?url=' + str + '&apikey=' + this.apiKey) : await Func.fetchJson(this.baseUrl + '/spotify-search?q=' + str + '&apikey=' + this.apiKey)
      return json
   }
   
   play = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/play?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   video = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/video?q=' + query + '&apikey=' + this.apiKey)
      return json
   }
   
   youtube = async (url, type = 'video', quality = '480p') => {
      let json = await Func.fetchJson(this.baseUrl + '/youtube?url=' + url + '&type=' + type + '&quality=' + quality + '&apikey=' + this.apiKey)
      return json
   }
   
   remini = async (image) => {
      let json = await Func.fetchJson(this.baseUrl + '/remini?image=' + image + '&apikey=' + this.apiKey)
      return json
   }
   
   ageDetector = async (image) => {
      let json = await Func.fetchJson(this.baseUrl + '/age?image=' + image + '&apikey=' + this.apiKey)
      return json
   }
   
   asupan = async (username) => {
      let json = await Func.fetchJson(this.baseUrl + '/asupan?username=' + username + '&apikey=' + this.apiKey)
      return json
   }  
   
   gptPro = async (query) => {
      let json = await Func.fetchJson(this.baseUrl + '/gpt-pro?q=' + query + '&apikey=' + this.apiKey)
      return json
   }  
   
   bardAi = async (query) => {
   	let json = await Func.fetchJson(this.baseUrl + '/bard?q=' + query + '&apikey=' + this.apiKey)
   	return json
   }
   
   capcut = async (url) => {
      let json = await Func.fetchJson(this.baseUrl + '/capcut?url=' + url + '&apikey=' + this.apiKey)
      return json
   }  
   
   scrop = async (image,style) => {
      let json = await Func.fetchJson(this.baseUrl + '/cropshape?image=' + image + '&style=' + style + '&apikey=' + this.apiKey)
      return json
   }  
   
   diffusion = async (query) => {
   	let json = await Func.fetchJson(this.baseUrl + '/diffusion?q=' + query + '&apikey=' + this.apiKey)
   	return json
   }
   
   ssweb = async (url, type = 'ss') => {
     let json = await Func.fetchJson(this.baseUrl + '/' + type + '?url=' + url + '&apikey=' + this.apiKey);
     return json
   }
   
   anime = async (query) => {
   	let json = await Func.fetchJson(this.baseUrl + '/anime?q=' + query + '&apikey=' + this.apiKey);
   	return json
   }
   
   animeGet = async (url) => {
   	let json = await Func.fetchJson(this.baseUrl + '/anime-get?url=' + url + '&apikey=' + this.apiKey);
   	return json
   }
   
   gdrive = async (url) => {
   	let json = await Func.fetchJson(this.baseUrl + '/gdrive?url=' + url + '&apikey=' + this.apiKey);
   	return json
   }
   
   neoxr = async (api, options) => {
   	let json = await Func.fetchJson(this.baseUrl + api + '?' + new URLSearchParams(options) + '&apikey=' + this.apiKey)
   	return json
   }
}