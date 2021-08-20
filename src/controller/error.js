const Base = require('./base.js');

module.exports = class extends Base {
  indexAction() {
    this.assign('site',this.config('site'));
    return this.display('error/404');
  }
  notFoundAction(){
    this.assign('site',this.config('site'));
    return this.display('error/404');
  }

  serverErrorAction(){
    this.assign('site',this.config('site'));
    return this.display('error/500');
  }
};
