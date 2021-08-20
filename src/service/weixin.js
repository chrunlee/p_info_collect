/****
 微信开发相关的工具类;通用;thinkjs3.0框架;
 @author chrunlee
 @create 2019年11月19日 16:30:59
*****/
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');//token 文件存储
const path = require('path');
const filePath = path.join(__dirname,'../../runtime/config/wx.json');
const ticketPath = path.join(__dirname,'../../runtime/config/ticket.json');
const Promise = require('bluebird');
const request = Promise.promisify(require('request'));
/***
 * 文件流promise封装
 */
function wsf(ws,rs){
    return new Promise((resolve,reject)=>{
        ws.on('close',()=>{
            resolve();
        });
        rs.pipe(ws);
    });
}
function loadQR (url,filePath) {
    return new Promise((r, j) => {
        axios.get(url, {
            responseType : 'stream'
        }).then(rs => {
            let ws = fs.createWriteStream(filePath);
            ws.on('close',()=>{
                r();
            });
            ws.on('error', (err) => {
                r(err);
            })
            rs.data.pipe(ws);
        }).catch(err => {
            j(err);
        })
    })
}


module.exports = class extends think.Service{

    /***
        传参:token/appid/appsecret,创建实例
        opts : {
            token : '',
            appid : '',
            secret : ''
        }
    ***/
    constructor(opts){
        super();
        this.opts = opts;
        this.url = {
            //获取access_token 
            access_token : `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${opts.appid}&secret=${opts.secret}`,
            //创建菜单
            create_menu : `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=ACCESS_TOKEN`,
            //发送模版消息
            send_template : `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=ACCESS_TOKEN`,
            //上传媒体素材
            upload_media: `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=TYPE`,
            
            //下载媒体素材
            download_media: `https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID`,
            //获取永久素材列表
            getlist_media : `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=ACCESS_TOKEN`,

            //获取用户信息
            user_info : `https://api.weixin.qq.com/cgi-bin/user/info?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN`,
            //获取短连接
            short_url : `https://api.weixin.qq.com/cgi-bin/shorturl?access_token=ACCESS_TOKEN`,
            //jsapi web端获取ticket
            jsapi : `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=ACCESS_TOKEN&type=jsapi`,

            //微信网页授权页面地址
            page_auth_url : `https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`,
            //微信网页授权获取token地址
            page_token_url: `https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code`,
            
            //二维码创建tiket -- 
            qr_ticket : `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=ACCESS_TOKEN`,
            //ticket 置换 二维码数据
            qr_file : `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=TICKET`
            
        };
        
    }

    //=========================access_token===============================
    

    //校验token
    validateToken(signature,timestamp,nonce){
        return crypto.createHash('sha1').update([this.opts.token,timestamp,nonce].sort().join('')).digest('hex') == signature;
    }

    //获取access_token ,存放在缓存中
    async getToken(){
        if(!fs.existsSync(filePath)){
            fs.writeFileSync(filePath,'{}');
        }
        let current = fs.readFileSync(filePath);
        current = JSON.parse(current);
        if(!current || !current.access_token || current.timestamp < +new Date()){
            //refresh
            let data = await axios.get(this.url.access_token).then(rs=>rs.data);
            data.timestamp = (+new Date() + data.expires_in*1000);
            current = data;
            fs.writeFileSync(filePath,JSON.stringify(current));
        }
        return current;
    }

    //获取网页token,然后将token存放在session中使用，每个用户一个，超时则刷新获取
    async getWebToken(code){
        let requestUrl = this.url.page_token_url.replace('APPID',this.opts.appid).replace('SECRET',this.opts.secret).replace('CODE',code);
        let data = await axios.get(requestUrl).then(rs=>rs.data);
        return data;
    }
    //获取网页jsticket
    async getTicket(token){
        if(!fs.existsSync(ticketPath)){
            fs.writeFileSync(ticketPath,'{}');
        }
        let current = fs.readFileSync(ticketPath);
        current = JSON.parse(current);
        if(!current || !current.ticket || current.timestamp < +new Date()){
            //refresh
            let data = await axios.get(this.url.jsapi.replace('ACCESS_TOKEN',token)).then(rs=>rs.data);
            data.timestamp = (+new Date() + data.expires_in*1000);
            current = data;
            fs.writeFileSync(ticketPath,JSON.stringify(current));
        }
        return current;
    }

    //生成js sdk 签名
    async createTicketSignature(noncestr,ticket,timestamp,url){
        let str = 'jsapi_ticket='+ticket+'&noncestr='+noncestr+'&timestamp='+timestamp+'&url='+url;
        let crypto = require('crypto');
        let sig = crypto.createHash('sha1').update(str).digest('hex'); 
        return sig;
    }

    //创建公众号菜单
    async createMenu(menuObj){
        let token = await this.getToken();
        let rst = await axios.post(this.url.create_menu.replace('ACCESS_TOKEN', token.access_token), menuObj).then(rs => rs.data);
        console.log(rst);
        return rst.errcode == 0;
    }

    //获取公众号页面网页授权引导页面地址
    getPageAuthUrl(url,state){
        console.log(url);
        state = state || 'chrunleecn';
        return this.url.page_auth_url.replace('APPID',this.opts.appid).replace('REDIRECT_URI',url).replace('STATE',state);
    }
    //===============================消息================================


    //处理微信发送的xml数据，整理成对象
    fixData (post){
        let obj = {};
        for(let key in post.xml){
            obj[key] = post.xml[key][0];
        }
        return obj;
    }

    //创建文本xml
    createText(data,content){
        return  `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[text]]></MsgType>
              <Content><![CDATA[${content}]]></Content>
            </xml>
        `;
    }
    //创建图片xml
    createImage (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[image]]></MsgType>
              <Image>
                <MediaId><![CDATA[${url}]]></MediaId>
              </Image>
            </xml>
        `;
    }

    //创建图片xml
    createVoice (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[voice]]></MsgType>
              <Voice>
                <MediaId><![CDATA[${url}]]></MediaId>
              </Voice>
            </xml>
        `;
    }

    //创建图片xml
    createVideo (data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[video]]></MsgType>
              <Video>
                <MediaId><![CDATA[${url}]]></MediaId>
                <Title><![CDATA[title]]></Title>
                <Description><![CDATA[description]]></Description>
              </Video>
            </xml>
        `;
    }

    //创建音乐消息
    createMusic(data,url){
        return `
            <xml>
              <ToUserName><![CDATA[${data.FromUserName}]]></ToUserName>
              <FromUserName><![CDATA[${data.ToUserName}]]></FromUserName>
              <CreateTime>${(+new Date())/1000}</CreateTime>
              <MsgType><![CDATA[music]]></MsgType>
              <Music>
                <Title><![CDATA[TITLE]]></Title>
                <Description><![CDATA[DESCRIPTION]]></Description>
                <MusicUrl><![CDATA[${url}]]></MusicUrl>
                <HQMusicUrl><![CDATA[${url}]]></HQMusicUrl>
                <ThumbMediaId><![CDATA[media_id]]></ThumbMediaId>
              </Music>
            </xml>
        `;
    }



    //发送莫把那些iaoxi
    async sendTemplate (data){
        let token = await this.getToken();
        let rst = await axios.post(this.url.send_template.replace('ACCESS_TOKEN',token.access_token),data).then(rs=>rs.data);
        return rst.msgid;//返回消息ID
    }

    //==========================素材==================================

    //上传
    upload(url,filePath,stat){
        return new Promise((resolve,reject)=>{
            request({
                url:url,
                method:'POST',
                formData:{
                    media : fs.createReadStream(filePath)
                },
                json:true
            }).then(function(response){
                var _data = response.body;
                if(_data){
                    resolve(_data)
                }else{
                    throw new Error('upload material failed!');
                }
            }).catch(function(err){
                reject(err);
            });
        });
        
    }
    //上传本地文件到微信服务器作为临时素材，获取Media_id
    async uploadMedia (type,filePath){
        let types = {
            'image' : {
                limit : 2 * 1024 * 1024,
                ext : ',.png,.jpeg,.jpg,.gif,'
            },
            'voice' : {
                limit : 2 * 1024 * 1024,
                ext : ',.amr,.mp3,'
            },
            'video' : {
                limit : 10 * 1024 * 1024,
                ext : ',.mp4,'
            },
            'thumb' : {
                limit : 64 * 1024,
                ext : ',.jpg,'
            }
        };
        if(!types[type]){
            throw new Error('素材类型不支持');
        }
        if(!fs.existsSync(filePath)){
            throw new Error('文件路径不正确');
        }       
        let extname = path.extname(filePath).toLowerCase();
        let typeObj = types[type];
        if(typeObj.ext.indexOf(extname) < 0){
            throw new Error('文件类型不支持')
        }
        let stat = fs.statSync(filePath);
        if(stat.size > typeObj.limit){
            throw new Error('文件大小超出限制')
        }
        let token = await this.getToken();
        let url = this.url.upload_media.replace('ACCESS_TOKEN',token.access_token).replace('TYPE',type);
        let rsr = await this.upload(url,filePath,stat);
        return rsr.media_id;
    }

    /****
        根据mediaId下载临时素材：图片
    ***/
    async downloadImage(mediaId,folderPath){
        let token = await this.getToken();
        let url = this.url.download_media.replace('ACCESS_TOKEN',token.access_token).replace('MEDIA_ID',mediaId);
        let realPath = await axios.get(url,{
            responseType : 'stream'
        }).then(async rs=>{
            let disposition = rs.headers['content-disposition'];
            let fileName = disposition.match(/filename="(.*)"/)[1];
            let filePath = path.join(folderPath,fileName);
            let ws = fs.createWriteStream(filePath);
            await wsf(ws,rs.data);
            return filePath;
        })
        return realPath;
    }
    //下载临时素材：视频文件
    async downloadVideo(mediaId){
        let token = await this.getToken();
        let url = this.url.download_media.replace('ACCESS_TOKEN',token.access_token).replace('MEDIA_ID',mediaId);
        let realPath = await axios.get(url).then(rs=>rs.data.video_url);
        return realPath;
    }

    //获取永久素材列表
    async getMediaList (type,page,pagesize) {
        page = Math.max(1, page);
        pagesize = Math.min(20, pagesize);
        let token = await this.getToken();
        let url = this.url.getlist_media.replace('ACCESS_TOKEN', token.access_token);
        let rst = await axios.post(url, {
            type, offset: (page - 1) * pagesize, count: pagesize
        }).then(rs => rs.data);
        console.log(rst);
        return rst;
    }


    //=======================用户信息========================

    //根据openId获得用户基本信息
    async getUserInfo(openId){
        let token = await this.getToken();
        let url = this.url.user_info.replace('ACCESS_TOKEN',token.access_token).replace('OPENID',openId);
        let data = await axios.get(url).then(rs=>rs.data);
        return data;
    }

    //长链接转短链接
    async getShortUrl(url){
        let token = await this.getToken();
        let qurl = this.url.short_url.replace('ACCESS_TOKEN',token.access_token);
        let data = await axios.post(qurl,{
            action : 'long2short',
            'long_url' : url
        }).then(rs=>rs.data);
        return data.short_url;
    }


    //获取二维码，包括临时永久等，参数自己规范
    async getQRCode (data,filePath) {
        let token = await this.getToken();
        let url = this.url.qr_ticket.replace('ACCESS_TOKEN', token.access_token);
        let form = {
            action_name: data.action_name,
            action_info: {
                scene : {}
            }
        }
        if (data.type == 0) {//临时
            form.expire_seconds = parseInt(data.expire_time)
        }
        if (data.action_name == 'QR_SCENE' || data.action_name == 'QR_LIMIT_SCENE') {
            form.action_info.scene.scene_id = parseInt(data.scene_str,10);
        } else {
            form.action_info.scene.scene_str = data.scene_str;
        }
        let rst = await axios.post(url, form).then(rs => rs.data);
        if (rst.errcode) {
            return {
                success: false,
                msg: rst.errmsg,
                code : rst.errcode
            }
        } else {
            rst.ticket = encodeURIComponent(rst.ticket);
            let fileUrl = this.url.qr_file.replace('TICKET', rst.ticket);
            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), {
                    recursive : true
                })
            }
            try {
                await loadQR(fileUrl, filePath);
            } catch (err) {
                console.log(err);
            }
            
            return {
                success: true,
                url: rst.url,
                expire_seconds : rst.expire_seconds
            }
        }
    }
}