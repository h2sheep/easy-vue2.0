// --------- compile node event ----------
const compileNode = { 
  
  getValue(expr, vm) {
    // 如果是msg 直接是data[msg]
    // 如果是person.name 第一次是data[person] 第二次是person[name]
    return expr.split('.').reduce((data, cur) => data[cur], vm.$data)
  },
  
  text(node, express, vm) { 
    let value = undefined
    // 是否包含mustache
    if (express.indexOf('{{') !== -1) {  // 包含  {{person.name}}
      // {{person.name}} => person.name
      value = express.replace(/\{\{(.*)\}\}/g, (...args) => {
        // 更新后将新值更新到页面
        new Watcher(args[1], vm, newVal => {
          this.update.textUpdate(node, newVal)
        })
        return this.getValue(args[1], vm)
      })
    } else {
      value = this.getValue(express, vm)
    }
    
    this.update.textUpdate(node, value)
  },
  
  html(node, express, vm) {
    const value = this.getValue(express, vm)
    // 更新后将新值更新到页面
    new Watcher(express, vm, newVal => {
      this.update.htmlUpdate(node, newVal)
    })
    this.update.htmlUpdate(node, value)
  },
  
  model(node, express, vm) {
    const value = this.getValue(express, vm)
    // 更新后将新值更新到页面 数据 -> 视图
    new Watcher(express, vm, newVal => {
      this.update.modelUpdate(node, newVal)
    })
    
    // 监听输入框的input事件 视图 -> 数据 -> 视图
    node.addEventListener('input', (e) => { 
      const attrs = express.split('.')  // [person, name]
      let i = 0
      attrs.reduce((data, cur) => {
        // 如果取到了值
        if (i === attrs.length - 1) {
          // 直接赋新值
          data[cur] = e.target.value
        }
        i++
        return data[cur]
      }, vm.$data)
    })
    
    this.update.modelUpdate(node, value)
  },
  
  on(node, express, vm, eventName) {
    // 事件回调
    let fn = vm.$options.methods[express]
    
    // 绑定事件 这里的this应该指向当前实例对象
    node.addEventListener(eventName, fn.bind(vm), false)
  },
  
  update: {
    textUpdate(node, value) {
      node.textContent = value
    },
    htmlUpdate(node, value) {
      node.innerHTML = value
    },
    modelUpdate(node, value) {
      node.value = value
    }
  }
}



// -------- Compile ----------

class Compile {
	
  constructor(el, vm) {
    // 1. 获取对应元素 
    this.el = this.isElementNode(el) ? el : document.querySelector(el)
    this.vm = vm
    
    // 2. 将元素中所有的子元素放进文档碎片中
    const frg = this.node2Frg(this.el)
    
    // 3. 编译
    this.compile(frg)
    
    // 4. 插入到页面中
    this.el.appendChild(frg)
  }
	
	
  
  // ----------- 转换成文档碎片 -----------------
  node2Frg(node) {
    // 创建文档碎片
    const frg = document.createDocumentFragment()
    
    // 获取node所有子节点并插入到碎片中
    let child = null
    while (child = node.firstChild) {
      frg.appendChild(child)
    }
    
    return frg
  }
  
  
  
  // ----------- 编译 -----------------  
  compile(frg) {
    // 获取所有的子节点并转换为数组
    const childNodes = [...frg.childNodes]
    
    childNodes.forEach(node => {
      
      // 元素节点 ? 编译元素(指令) : 编译文本(mustache)
      this.isElementNode(node) ? this.compileElementNode(node) : this.compileTextNode(node)
      
      // 如果还存在子节点 递归遍历
      if (node.childNodes && node.childNodes.length) {
        this.compile(node)
      }
    })
  }
  
  
  compileElementNode(node) {  // 编译元素
    // 获取元素属性
    const attrs = [...node.attributes]
    
    attrs.forEach(attr => {
      const {name, value} = attr
      
      if (this.isDirective(name)) { // 是否为指令 v-text v-model v-on:click ...
      
        const [_, directive] = name.split('-') // text html on:click  ...
        const [dirName, eventName] = directive.split(':') // text html on ...
        
        // 处理事件 更新数据
        compileNode[dirName](node, value, this.vm, eventName)
	      
	// 删除指令属性
        node.removeAttribute(name)
          
      } else if (name.startsWith('@')) {  //@click
      
        const [_, eventName] = name.split('@')  // click 
        compileNode['on'](node, value, this.vm, eventName)
        node.removeAttribute(name)
      }
    })
  }
  
  compileTextNode(node) { // 编译文本
    const content = node.textContent
    const reg = /\{\{(.*)\}\}/
    
    // 匹配mustache
    if (reg.test(content)) {
      compileNode['text'](node, content, this.vm)
    }
  }


  
  // 判断是否是元素节点
  isElementNode(node)  {
  	return node.nodeType === 1
  }
  // 是否为指令 以v-开头
  isDirective(str) {
    return str.startsWith('v-')
  }
}



/* * 这里只是简单进行了事件指令等语法的解析，细节需要自己去看源码 = =
 * * 
 * * Compile部分就分为三大步：
 * *  1. 取出模板中所有子元素，放进文档碎片中
 * *  2. 对子元素中的指令，mustache语法等进行编译
 * *  3. 将文档碎片重新插入到页面中进行视图更新
 * 
 * * 细节：
 * *  *  每次解析指令时，说明会发生数据更新
 *    *  所以要在这时候创建watcher并更新视图
 */
