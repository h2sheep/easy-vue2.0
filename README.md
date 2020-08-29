# mvvm

* 简易mvvm源码实现
  * 数据绑定
  * 模板解析
  * 数据代理
  
* 核心部分

 * 观察者模式
   * 通过Object.defineProperty()对每个属性进行劫持监听，并为其创建一个Dep实例对象，用来订阅所有的watcher，并在值改变时发布通知所有watcher进行更新
   * Dep中用一个数组subs来保存所有的watcher，调用属性的setter方法 时，notify数组中所有watcher调用update方法去更新值
   * Watcher中update方法会将新值通过callback函数返回出来，可以进行更新视图操作

 * dep的订阅和发布
   * 在解析对应的指令时，就创建一个watcher，并挂载到Dep的target属性上
   * 获取属性的时候，会调用对应的getter方法，这时dep会将该watcher保存到subs中
   * 细节处理：订阅完毕，清除target的引用，因为下次读取时，target不为null，又会添加一次，就会浪费资源
   * 当属性值改变时，会调用对应的setter方法，这时dep会notify所有watcher更新
 
  
* 博客：https://h2sheep.cn/
