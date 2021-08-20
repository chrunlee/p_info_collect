const Base = require('./base.js');
let axios = require('axios');
let moment = require('moment');

module.exports = class extends Base {
  indexAction () {
    let id = this.query('id')||'';
    let redirectURI = this.config('site').domain.value + '/index/redirect';
    let appid = this.config('site').wxappid.value;
    let scope = 'snsapi_userinfo';
    let code = id;
    let codeUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirectURI}&response_type=code&scope=${scope}&state=${code}#wechat_redirect`;
    return this.redirect(codeUrl);
  }

  async redirectAction () {
    let code = this.query('code');
    let state = this.query('state');
    let site = this.config('site');
    let sysUser = await this.session('user');
    if (!sysUser) {
      this.wx = this.service('weixin', {
        token: site.wxtoken.value,
        appid: site.wxappid.value,
        secret: site.wxappsecret.value
      });
      let rs;
      try {
        rs = await this.wx.getWebToken(code);
        console.log(rs);
      } catch (e) {
        console.log(e);
      }
      if (!rs.openid) {//openid 不存在，发生错误，重新进入。
        return this.redirect('index');
      }
      let openId = rs.openid;
      sysUser = await this.model('sys_user').where({ openid: openId }).find();
      if (think.isEmpty(sysUser)) {
        let access_token = rs.access_token;
        let userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openId}&lang=zh_CN`
        let userInfo = await axios.get(userUrl).then(rs => rs.data);
        sysUser = userInfo;
        try {
          await this.model('sys_user').add(userInfo);  
        } catch (e) {
          console.log(e);
        }
        
      }
      //当前用户登录
      await this.session('user', sysUser);
    }

    //此处需要将获得的state ,然后查找对应的记录，进行数据更新。并提示关闭当前页面。
    return this.redirect(site.domain.value+'/index/form?id='+state);
  }

  async formAction () {
    let id = this.query('id')||'';
    let site = this.config('site');
    let sysUser = await this.session('user');
    if (!sysUser) {
      return this.redirect(site.domain.value + '/index?id=' + id);
    }
    this.assign('id', id);
    this.assign('user', sysUser);
    this.assign('site', site);
    let list = await this.model('school').order('ctime asc').select();
    let count = await this.model('record').count();
    this.assign('list', list);
    this.assign('total', count);
    this.assign('liststr', JSON.stringify(list));
    return this.display('index');
  }

  async saveFormAction () {
    let sysUser = await this.session('user');
    if (!sysUser) {
      return this.json({success:false,msg:'当前登录失效,请重新扫码进行提交'})
    }
    let data = this.post();
    console.log(data);
    //提交数据
    data.id = think.uuid('v4').toString().replace(/-/g, '');
    data.openid = sysUser.openid;
    data.ctime = moment().format('YYYY-MM-DD HH:mm:ss');
    await this.model('record').add(data);
    return this.json({success:true,msg:'提交成功'})
  }

  async getLastAction () {
    let sysUser = await this.session('user');
    if (!sysUser) {
      return this.json({success:false,msg:'当前登录失效,请重新扫码进行提交'})
    }
    let last = await this.model('record').where({ openid: sysUser.openid }).order('ctime desc').limit(0, 1).find();
    last.ctime = moment(last.ctime).format('MM/DD HH:mm');
    let count = await this.model('record').where({ openid: sysUser.openid }).count();
    let allcount = await this.model('record').count();
    return this.json({ success: true, count: count,allcount : allcount, last: last });
  }

  async historyAction () {
    let site = this.config('site');
    let sysUser = await this.session('user');
    if (!sysUser) {
      return this.redirect(site.domain.value + '/index');
    }
    let list = await this.model('record').where({ openid: sysUser.openid }).order('ctime desc').select();
    this.assign({
      user: sysUser,
      list : list
    })
    return this.display('history');
  }
  async detailAction () {
    let sysUser = await this.session('user');
    if (!sysUser) {
      return this.redirect(site.domain.value + '/index');
    }
    let id = this.query('id');
    let record = await this.model('record').alias('t1')
      .join({
        table: 'school',
        as : 't2',
        on: ['schoolid', 'id'],
        join : 'left'
      }).where({ 't1.id': id, 't1.openid': sysUser.openid }).field('t1.*,t2.name as schoolname').find();
    this.assign('user', sysUser);
    this.assign('form', record);
    return this.display('detail');
  }
};
