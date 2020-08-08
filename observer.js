// ---------- Observer ---------

class Observer {
  constructor(data) {
    this.data = data
    // 监听data中每个属性
    this.observe(this.data)
  }
  
  
  observe(data) {
    if (data && typeof data === 'object') {
      // 进行响应式管理
      Object.keys(data).forEach(key => this.defineReactive(data, key, data[key]))
    }
  }
  
  
  defineReactive(obj, key, value) {
    // 当前value可能还是对象类型，需要深度监听
    this.observe(value)
    
    // 一个属性对应一个dep实例对象
    const dep = new Dep()
    
    // 进行数据劫持
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: false,
      
      // 每当存在一个watcher获取属性值时，就会调用get
      get() {
        // 保存watcher
        Dep.target && dep.addSubs(Dep.target)
        return value
      },
      
      // 当watcher值被修改后，就会调用set
      set: newVal => { 
        // 对新值也需要进行数据劫持监听
        this.observe(newVal)
        // 通知所有watcher进行更新
        if (newVal !== value) {
          value = newVal
          dep.notify()
        }
      }
    })
  }
}


// ---------- Dep ----------
class Dep {
  constructor() {
    this.subs = []
  }
  
  // 订阅
  addSubs(watcher) {
    this.subs.push(watcher)
  }
  
  // 发布
  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}


// ------------ Watcher ----------
class Watcher {
  constructor(expr, vm, callback) {
    this.expr = expr
    this.vm = vm
    this.callback = callback
    // 保存当前的值
    this.oldVal = this.getValue()
  }
  
  getValue() {
    // 一创建实例，将挂载到target属性上
    Dep.target = this
    
    // 取值，调用get方法，放进subs中
    const val = compileNode.getValue(this.expr, this.vm)
    
    // 消除target引用
    Dep.target = null
  }
  
  // 更新视图
  update() {
    // 获取新值
    const newVal = compileNode.getValue(this.expr, this.vm)
    // 如果值不一样
    if (newVal !== this.oldVal) {
      // 直接回调进行更新视图
      this.callback(newVal)
    }
  }
}

/* 细节：dep如何获取对应的watcher？
  * 一旦创建一个watcher，就挂载到Dep的私有属性target上
  * 进行取值的时候，会调用对用属性的get方法，并将watcher存进subs中
  * 之后需要将原来watcher消除，不然会一直留在subs中
  * 每次更新数据前应该是本次需要更新的数据，前面更新过的不应该存在
  * 
  * 更新值的时候同理，this.msg = 'yukino'
  * 左边取值调用getter，右边赋值调用setter
 */
