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
  
  // 添加watcher
  addSubs(watcher) {
    this.subs.push(watcher)
  }
  
  // 通知所有的watcher更新
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
    this.oldVal = compileNode.getValue(this.expr, this.vm)
    
    // 将当前watcher挂载到Dep的target属性上
    Dep.target = this
    this.update()
    // 更新后就取消原来值挂载
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

/* 细节：
  * dep如何获取对应的watcher，将当前watcher挂载到Dep的私有属性target上
  * 一旦属性值发生改变，左边会进行获取调用get方法，将watcher存进subs中
  * 右边赋值时会调用set方法，通知所有watcher更新
  * 之后需要将原来watcher消除，不然会一直留在subs中
  * 每次更新数据前应该是本次需要更新的数据，前面更新过的不应该存在
 */