+++
date = "2016-03-28T14:56:30+08:00"
draft = false
title = "Go的异常处理（附最佳实践）"
Categories = ["Golang心得"]
description = "在程序执行的时候，很可能会遇到各种各样的问题，可能是内部的..."
menu = "golang"
+++

## 前言

在程序执行的时候，很可能会遇到各种各样的问题，可能是内部的逻辑问题，也可能是外部环境依赖问题。

作为开发者，要提前考虑到程序执行时可能出现的各种问题，来提前预定义好相对应的处理逻辑。

不同的语言，有不同的异常处理方式。比如C语言使用error code的方式，python和java采用try机制等。

而golang的处理方式就显得比较有一点别致了。


## 异常的种类

我个人看法，异常可以分为两大类：

- 一类是会影响整个程序继续执行的异常，遇到这种问题，可能我们当前进程或线程就会直接退出。
- 另一类是，某一个小逻辑有问题，我们向上层通知一下之后程序仍然要继续执行。

不同的异常，应该有不同的处理方式，golang也提供了两种不同的方式来分别处理这两类。

## error类型

golang有一个内建的error类型，用来存放异常信息。
其实error是一个interface。它预定义的interface是这样的：

    type error interface {
	    Error() string
    }

任何一种类型，只要实现了Error()方法，都可以赋值给error类型，这就给了我们很多可定制化的空间，这个我们后边再讲。

当然，如果我们没有很复杂的需求时，我们可以这样来新建一个字符串类型的error实例：

    err := errors.New("I'm error msg...")

也可以使用fmt包中的Errorf和Errorln这两个方法：

    err := fmt.Errorf("I'm error msg...")
    err1 := fmt.Errorln("I'm error msg ...")

这两种方式都可以生成一个error类型的实例，向上层传递。

如果没有异常，我们应该返回nil。

在上层，我们可以这样获得异常的详情：

    msg := err.Error()

这就是error最简单的向上层传递。

## 简单的panic与recover

考虑这种情况：如果我们的调用栈比较深。在最底层的方法中，我们发现了一个很严重的异常，要直接返回到最上层，用这种一级一级的传递显然是很麻烦的。

golang提供了一种直接把异常向上层抛的机制，类似python的**raise&except**。这就是**panic&recover**。

panic的声明如下：

    func panic(v interface{})

可以传递任何的参数，让panic抛出异常。

当golang遇到panic语句时，当前方法会立刻停止执行，向上层返回（若有defer先defer）。

上层方法接收到panic信号之后，所有响应就相当于方法内panic一致。

panic就这样一级一级向上层传递，如果遇到recover则恢复，否则最终程序将直接终止。

因为panic无法绕过defer的逻辑，因此我们一般把recover放在defer里。

简单的用法如下：

    func panic_test() {
        defer func(){
	    	if err := recover(); err != nil {
				fmt.Println(err)
			}    
        }()
		panic("I am an error ....")
    }

在上例中，我们给panic传递的是一个字符串，所以可以直接print。但panic可以接受任何参数哦，这样用起来是不是有些浪费？

## 定制panic参数

如果我们需要panic向上层传递更多的信息，传一个字符串可能就不太够用了。

上边说道我们可以传递任意参数给panic，我们可以是不是可以考虑定义一个结构体，里边存起我们所有需要的信息。

    type MyErr struct {
		level  int
		msg    string
		detail string
	}

	func main() {
		defer func() {
			if err := recover(); err != nil {
				if my_err, ok := err.(MyErr); ok {
					fmt.Println("level : ", my_err.level)
					fmt.Println("msg : ", my_err.msg)
					fmt.Println("detail : ", my_err.detail)
				} else {
					fmt.Println(err)
				}
			}
		}()

		panic(MyErr{1, "I'm msg..", "I'm detail.."})
	}

好啦，这样我们在recover中就可以获取到结构体中的所有内容了，这样传递异常信息是不是很方便呢？

## 个人Web开发最佳实践

学习golang也有半年多了，对于golang web开发一直滚打摸爬，学习过一些框架。

个人整理了一个自己用的最佳实践，分享给大家，个中不足还请指正，如果大家有更好的意见和建议请随时联系我^_^。 (此处感谢[陈子军](https://github.com/danche)老师的分享和指导)

笔者个人用过beego、gin和martini等框架。这些MVC框架都是由Model-View-Controller来分层的。有时候我们也会人为的在代码中分一些层级。

如果在model层发现一些会直接异常的问题时，一层一层向上返回，最终再由HTTP返回，这样无疑是很麻烦的，会很大程度的增加开发成本、增加维护成本。

因此我会在任何地方，直接向上层panic出来；然后在controller层，统一recover。抛出来的异常，是由我们自己定义的结构体，所有信息我们都可以处理。这里我们可以定义一个适合于HTTP返回的结构体。

    type Error struct {
		Code int    `json:"code"`
		Msg  string `json:"msg"`
	}


	func _build(code int, defval string, custom ...string) Error {
		msg := defval
		if len(custom) > 0 {
			msg = custom[0]
		}

		return Error{
			Code: code,
			Msg:  msg,
		}
	}

	func DBError(msg ...string) Error {
		return _build(http.StatusInternalServerError, "DB Error", msg...)
	}

	func ParamError(msg ...string) Error {
		return _build(http.StatusBadRequest, "Param Error", msg...)
	}

	func ServerError(msg ...string) Error {
		return _build(http.StatusInternalServerError, "Server Error", msg...)
	}

	func PrivError(msg ...string) Error {
		return _build(http.StatusForbidden, "Forbidden Error", msg...)
	}

	func HandleError() {
		if err := recover(); err != nil {
			if msg, ok := err.(Error); ok {
				log.Print(msg)
				//我们自己程序内部触发的panic
				//TODO:这里我们根据错误内容可以做HTTP的返回等其他操作
			} else {
				if err_2, ok := err.(error); ok {
					//request的异常的panic
					msg := err_2.Error()
					log.Print(msg)
				}
			}
		}
	}	

以上。

异常的处理方式，不同的项目架构应该有不同的方式。

这种方式其实导致了model层和controller层的耦合，不过在具体使用的时候，我会在model层和controller层中间再抽出一层manager层。model只负责处理数据，而manager才真正负责业务逻辑。不过如果我们复用manager层代码的时候，可能会有些麻烦。不过开发中复用manager层还是比较少的哈。

因此：这种方式只适用于：**个人敏捷开发，周期短，需要代码维护成本较低，且有独立的逻辑模块**的项目。

