const axios = require('axios');
/***
 * 前台展示
 **/
module.exports = class extends think.Controller {

    async __before(){
        let config = this.config('site');
        this.site = config;
    }
    async loginAction(){
        //login theme
        let admin = await this.session('admin');
        if(!think.isEmpty(admin)){
            return this.redirect('center/index/index')
        }
        let theme = await this.model('sys_login_theme').where({enable :'1'}).find();
        this.assign('theme',theme);
        return this.display('center/login');
    }

    async logoutAction(){
        await this.session('admin',null);
        return this.redirect('/center/login');
    }

    /***
     * 管理系统后台登录
     * 3次错误，24H不允许登录。
     */
    async indexAction(){
        console.log(`提交登录数据-----${this.post().user}`)
        let admin = await this.session('admin');
        //判断当前系统
        if(!think.isEmpty(admin)){
            return this.redirect('/center/index/index');
        }
        if(this.isPost){
            let data = this.post();
            let user = data.user.trim();
            let pwd = data.pwd.trim();
            //校验帐号和密码
            //这里为了方便后台修改密码，不做md5加密。
            let et = await this.session('loginErrorTimes') || {times : 0};
            if(et.times > 3 && (+new Date()) < et.expiretime ){
                return this.json({
                    msg: '登录失败，错误次数过多，当前不允许登录!',
                    success : false
                })
            }else if(et.times > 3 && (+new Date()) > et.expiretime){
                //已经超时，继续后续
                await this.session('loginErrorTimes',{times : 0,expiretime : 0})
            }
            if (this.site.superaccount.value === user && this.site.superpwd.value === pwd) {
                //登录成功
                await this.session('admin', {
                    name: '系统管理员'
                });
                return this.json({success : true});
            } else {
                let etr = await this.session('loginErrorTimes') || {times : 0};
                etr.times = etr.times+1;
                await this.session('loginErrorTimes',{
                    times : etr.times,
                    expiretime : etr.times > 3 ? (+new Date())+(24*60*60*1000) : 0
                })
                return this.json({
                    msg: '登录失败，用户名或密码不正确',
                    success : false
                })
            }
        }
        return this.display('center/login');
    }

};