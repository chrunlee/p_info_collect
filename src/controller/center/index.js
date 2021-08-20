const uuid = require('node-uuid');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
let xlsx = require('node-xlsx');
module.exports = class extends think.Controller {

    async __before () {
        let user = await this.session('admin');
        if (!user) {
            return this.redirect('/');
        }
        this.assign('user', user);
    }

    //========================首页===================
    indexAction () {
        return this.display('center/index');
    }
    /***
     * 后台管理home首页
     */
    homeAction () {
        return this.display('center/home');
    }

    /***
     * 子系统属性管理页面
     */
    async manageAction () {
        let list = await this.model('wx_set').select();
        this.assign('list', list);
        return this.display('center/manage/list')
    }
    /**
     * 更新子系统属性数据
     */
    async systemSetUpdateAction () {
        let name = this.post('name');
        let value = this.post('value');
        await this.model('wx_set').where({ name }).update({ strval: value });
        //同时更新对应的config数据
        let rec = await this.model('wx_set').where({ name }).find();
        rec.value = rec.strval;
        let site = this.config('site');
        site[name] = rec;
        await this.config('site', site);
        return this.json({ success: true, msg: '属性更新成功.[' + name + ']' });
    }

    async schoolListAction () {
        return this.display('center/school/list');
    }
    async schoolDataAction () {
        let page = this.get('page') || 1,
            limit = this.get('limit') || 10;
        let list = await this.model('school').limit((page - 1 * limit), limit).order('ctime asc').select();
        let count = await this.model('school').count();
        return this.json({ code: 0, count: count, data: list });
    }
    async schoolAddAction () {
        return this.display('center/school/add');
    }
    async shoolEditAction () {
        let id = this.get('id')
        let form = await this.model('school').where({ id: id }).find();
        this.assign('form', form);
        return this.display('center/school/add');
    }
    async schoolDeleteAction () {
        let id = this.post('id');
        if (id) {
            await this.model('school').where({ id: id }).delete();
            return this.json({ success: true, msg: '删除成功' })
        } else {
            return this.json({ success: false, msg: '参数错误，请刷新重试' })
        }
    }
    async schoolSaveAction () {
        let name = this.post('name').trim(),
            id = this.post('id');
        let { headtitle, subtitle, postimg } = this.post();
        if (name == '') {
            return this.json({ success: false, msg: '学校名称不能为空' })
        }
        if (id == '' || null == id || undefined == id) {
            let repeat = await this.model('school').where({ name }).select();
            if (repeat && repeat.length > 0) {
                return this.json({ success: false, msg: '学校名称不能重复' })
            }
            let newid = think.uuid('v4').toString().replace(/-/g, '');
            await this.model('school').add({
                name: name,
                id: newid,
                ctime: moment().format('YYYY-MM-DD HH:mm:ss'),
                postimg: postimg,
                headtitle: headtitle,
                subtitle: subtitle,
                status: 0
            });
            return this.json({ success: true, msg: '新增成功' })
        } else {
            await this.model('school').where({ id: id }).update({
                name: name,
                postimg: postimg,
                headtitle: headtitle,
                subtitle: subtitle
            });
            return this.json({ success: true, msg: '更新成功' })
        }
    }

    async updateSchoolStatusAction () {
        let { id, status } = this.post();
        if (id) {
            await this.model('school').where({ id: id }).update({ status });
            return this.json({ success: true, msg: '更新成功' })
        } else {
            return this.json({ success: false, msg: '参数有误，请刷新重试' })
        }
    }


    async recordAction () {
        let list = await this.model('school').order('ctime asc').select();
        this.assign('list', list);
        return this.display('center/record/list');
    }
    async recordListAction () {
        let page = this.get('page') || 1,
            limit = this.get('limit') || 10;
        let schoolid = this.get('schoolid');
        let start = this.get('start');
        let end = this.get('end');
        let count = 0, list = [];
        let where = {};
        let hasw = false;
        if (schoolid) {
            hasw = true;
            where['t1.schoolid'] = schoolid;
        }
        if (start && end) {
            hasw = true;
            where['t1.ctime'] = ['between', start + ' 00:00:00,' + end + ' 00:00:00'];
        }
        if (hasw) {
            list = await this.model('record').alias('t1')
                .join({
                    table: 'school',
                    as: 't2',
                    on: ['schoolid', 'id'],
                    join: 'left'
                })
                .join({
                    table: 'sys_user',
                    as: 't3',
                    on: ['openid', 'openid'],
                    join: 'left'
                })
                .where(where).field('t1.*,t2.name as schoolname,t3.nickname').limit((page - 1) * limit, limit).order('ctime desc').select();
            count = await this.model('record').alias('t1').where(where).count();
        } else {
            list = await this.model('record').alias('t1').join({
                table: 'school',
                as: 't2',
                on: ['schoolid', 'id'],
                join: 'left'
            }).join({
                table: 'sys_user',
                as: 't3',
                on: ['openid', 'openid'],
                join: 'left'
            }).field('t1.*,t2.name as schoolname,t3.nickname').limit((page - 1) * limit, limit).order('ctime desc').select();
            count = await this.model('record').count();
        }
        return this.json({ code: 0, count: count, data: list });
    }
    //导出记录
    async exportAction () {
        let schoolid = this.get('schoolid');
        let start = this.get('start');
        let end = this.get('end');
        let count = 0, list = [];
        let where = {};
        let hasw = false;
        if (schoolid) {
            hasw = true;
            where['t1.schoolid'] = schoolid;
        }
        if (start && end) {
            hasw = true;
            where['t1.ctime'] = ['between', start + ' 00:00:00,' + end + ' 00:00:00'];
        }
        if (hasw) {
            list = await this.model('record').alias('t1')
                .join({
                    table: 'school',
                    as: 't2',
                    on: ['schoolid', 'id'],
                    join: 'left'
                })
                .join({
                    table: 'sys_user',
                    as: 't3',
                    on: ['openid', 'openid'],
                    join: 'left'
                })
                .where(where).field('t1.*,t2.name as schoolname,t3.nickname').order('ctime desc').select();
        } else {
            list = await this.model('record').alias('t1').join({
                table: 'school',
                as: 't2',
                on: ['schoolid', 'id'],
                join: 'left'
            }).join({
                table: 'sys_user',
                as: 't3',
                on: ['openid', 'openid'],
                join: 'left'
            }).field('t1.*,t2.name as schoolname,t3.nickname').order('ctime desc').select();
        }
        if (list && list.length > 0) {
            let data = [['用户昵称', '所属校区', '姓名', '手机号码', '身份证号', '体温', '提交时间']];
            list.forEach(t => {
                data.push([t.nickname, t.schoolname, t.name, t.phone, t.idcard, t.temp, t.ctime])
            })
            let buffer = xlsx.build([{ name: 'sheet1', data: data }]);
            let name = (+new Date()) + Math.round(Math.random() * 10000) + '.xlsx';
            let staticPath = '/static/upload/' + name;
            let filePath = path.join(think.ROOT_PATH, 'www/static/upload/' + name);
            fs.writeFileSync(filePath, buffer);
            return this.json({ success: true, filePath: staticPath });
        }
        return this.json({ success: false, msg: '当前条件下暂无记录可以导出' })
    }

    async uploadAction () {
        let file = this.file('file');
        let filePath = '/static/upload/' + (+new Date()) + '-' + (Math.round(Math.random() * 10000)) + '' + path.extname(file.name);
        let realFilePath = path.join(think.ROOT_PATH, 'www', filePath);
        if (!fs.existsSync((path.join(think.ROOT_PATH, 'www/static/upload')))) {
            fs.mkdirSync(path.join(think.ROOT_PATH, 'www/static/upload'));
        }
        fs.renameSync(file.path, realFilePath);
        return this.json({ success: true, filePath: filePath })
    }

   

};