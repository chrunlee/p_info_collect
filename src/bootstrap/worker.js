// invoked in worker

// 1. 启动的时候获取site 信息，并存储。
const isDev = think.env === 'development';
think.beforeStartServer(async () => {
  //dev
  let obj = {}
  let wxset = await think.model('wx_set').select();
  wxset.forEach(item => {
    item.value = item.strval;
    item.toString = function () {
      return this.value;
    }
    obj[item.name] = item;
  })
  think.config('site', obj);
})