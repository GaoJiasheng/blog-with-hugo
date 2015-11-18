+++
date = "2015-11-18T21:30:30+08:00"
draft = false
title = "深度学习Python装饰器"
Categories = ["Python大法"]
description = "Python装饰器是个很好玩的东西，让我们一步一步来了解这个东西..."
menu = "other-mountain"
+++

Python装饰器是个很好玩的东西，我们一步一步来了解这个东西。

## 首先，有一个函数
首先，python的函数，不用多少了吧？最简单的例子如下：

    def do():   #定义一个简单的函数
        print "I am doing something..."

## 然后要知道，一切皆对象
python中，一切皆是对象。函数也一样：

    do2 = do  #把函数赋值给另一个变量，仍然可以直接使用
    do2()
    
把函数赋值给另一个变量，仍然可以直接使用

## 切片的需求
现在有个新的需求，要在调用Do这个函数的之前和之后，都要做一些事情。
也就是要让do这个函数，插入到一个逻辑的中间去。
也可以理解为“__我们正在往面包里夹火腿__”。
那我们代码可以这么写：

    def new_do():
        print "Before : Do something ..."
        do()   #do处在一个逻辑的中间，这是一种切片的设计模式
        print "After : Do somthing ..."

到这里，之前的需求已经得到了解决。

## 代码的可复用

然而，事情没有那么简单。
现在我们有很多个与do类似的函数，do2、do3、do4，都需要用这同一个切片逻辑。难道我要重复定义new_do2、new_do3吗？
当然不是，我们可以这样让代码复用起来：

    def new_do(func):
		print "Before : Do something ..."
		func()
		print "After : Do something ..."
	
	new_do(do)
	new_do(do1)
	new_do(do2)

代码复用起来了，我们并没有多写代码，很赞。

## 如何更快速的更新到代码

工程师追求完美的脚步是永远不会停止的。
如果添加这个切片的需求，是一个后期的需求，而我的do、do1、do2、do3...等等的函数，已经分布在了我所有代码中的n个文件的m行了。
我是不是要把每个地方的函数调用都修改成这样呢：

    new_do(do)  #原来是do()，如果有200处，我要处处修改

很显然，这并不是最优的方案。

毋庸置疑，最优的方案，肯定是不需要处处去修改的。
那我们就可以以这个为目标，来思考怎样可以不用处处修改。

原调用如果仍然是do()，同时还要做到new_do的逻辑，我们只能替换do的函数定义。
就像这样：
    
    do = new_do(do)
    do2 = new_do(do2)

这样一来，python的万物皆对象这一点特性就派上用场了。
new_do的定义就呼之欲出了：

    def new_do(func):
        def do_with_logical():
            print "Before : Do something ..."
            func()
		    print "After : Do something ..."
		return do_with_logical

    do = new_do(do)
    do2 = new_do(do2)

new_do将返回一个函数，这个函数，是封装过了函数do的添加了逻辑的新的函数。
我们在源头替换了do的定义，这样只需要替换do的定义就可以了。

## 装饰器

其实到了这里，装饰器就已经有了，new_do就是一个很典型的装饰器了。
就像是给一个函数加了一件装饰。因此叫装饰器。

但是这么写，是不是不用高端不够大气不够上档次？
没有几个语法糖，你好意思出来说自己是高级语言？

语法糖来了：

    @new_do
    def do():
        print "Do Something..."

是不是感觉很清爽很干净很高端很让不懂的人感觉高大上？好的，目的达到了。

## 函数带参数

函数带参数怎么办呢？这个也简单，返回的那个函数支持下参数不就好了？

    def new_do(func):
        def do_with_logical(a, b):
            print "Before : Do something ..."
            func(a, b)
		    print "After : Do something ..."
		return do_with_logical

    @new_do
    def do(a, b):
	    print "In do ", a, b
    
    do(1, 2)

搞定！

## 函数参数可变

然而，还是那句话，工程师追求完美的脚步是永远无法停止的。
如果do1、do2、do3的参数并不是那么的规整，而这些参数又与我们装饰器的的逻辑无关。
理论上代码仍然是可复用的。
要屏蔽参数的影响，那我们装饰器返回的这个方法，首先得支持可变参数：

    def new_do(func):
        def do_with_logical(*args, **xwargs):
            print "Before : Do something ..."
            func(*args, **xwargs)
		    print "After : Do something ..."
		return do_with_logical

	@new_do
    def do(a, b):
	    print "In do ", a, b

	@new_do
	def do1(a, b, c, d):
	    print "In do1", a, b, c, d
    
    do(1, 2)
    do1(1, 2, 3, 4) 

## 装饰器带参数

好了，现在我们的装饰器已经渐渐完善起来了，还缺点什么呢？
我们装饰器的逻辑是固定的，是否可以让装饰器带上参数，这样逻辑就可以更灵活呢？

让我们一步步来分析。
原来，我们的逻辑是这样的：

    @new_do
    def do():
	    print "Do Something ..."

这个写法其实是等同于：
    
    def do():
        print "Do Somethins ..."

    do = new_do(do)

现在我们想要给装饰器加参数，我们的写法就要变成这样：

    do = new_do("args")(do)
   
根据上述的调用方法，我们可以来思考下装饰器的定义需要有哪些变化：
- new_do("args")其实等同于曾经的new_do
- 其他的逻辑，还是要遵从之前的定义

新的new_do定义，就变成了这样：

    def new_do(module):
        def ori_new_do(func):
	        def do_with_logical(*args, **xwargs):
	            print "[%s]Before : Do something ..." % (module, )
	            func()
			    print "[%s]After : Do something ..." % (module, )
			return do_with_logical
		
		return ori_new_do

	@new_do("LogModule")
	def do():
		print "In do function"

	@new_do("NewModule")
	def do2():
		print "In do2 function"

其实原理与之前的是一样的，新的new_do("module")与之前的new_do是等价的。
只是多封装了一层，对参数处理之后，返回之前的new_do，接下来逻辑就跟之前一样了。

## 发散

装饰器可以带参数了，在python中“一切皆对象”又牌上用场了，你可以把任何的东西传给装饰器，比如说，类。
感觉这是个应该是个很有意思的玩法，虽然我没在实际项目中试过。
