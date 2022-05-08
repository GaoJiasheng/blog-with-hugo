+++
date = "2016-05-12T22:23:00+08:00"
draft = false
toc = false
title = "Golang的Interface——更强大的面向对象"
Categories = ["技术"]
description = "Go语言中，是没有类这个概念的。但实际上，抽象却是无处不在的。"
menu = "develop"
+++
 
# interface是“类的类”

Go语言中，是没有类这个概念的。但实际上，抽象却是无处不在的。
对结构体的定义和继承、结构体方法的绑定。无处不暗示着Go语言对于**面向对象**原生的支持。

类，是实体的抽象。将过程归纳成对实体的一个一个操作。
而在我看来，Interface就是对类的**归类**。

# 从结构体开始讲起

Go语言的结构体，基本类似于其他语言的对象了。但是又不完全一样。

其他语言的对象是一个大的聚合，其中包括成员和方法。
而Go语言的实现对象，只是一个结构体，结构体中，只有成员。当然你可以给结构体绑定一系列的方法。但这一系列方法，却不归结构体所有。

从实现和编程复杂度来讲，两种设计方式是差不多的。

假设一个人是一个对象，他的主体当然是这个人所拥有的所有属性。你会觉得**面试**、**唱歌**、**跳舞**这种过程是属于一个人的一部分吗？这些只是一个人的表现而已。

我个人理解，Go语言的结构体，更加贴近我们现实生活中的**实体**这个概念。


# 结构体的类型——interface

如果仅仅是如上述所说，Go语言其实并没有特别突出的亮点。
然而，当很多人接触Interface这个概念的时候，都会有“眼前一亮”的感觉。

假设我要传一个变量给一个函数，但是我并不知道这个变量是什么类型的，函数只关心这个变量的一个Sing()方法，这个方法会返回一个字符串。传统的编程方法就有些乏力了。

假设我们有三个类：分别是Person、Bird和Dog，所有的属性都不相同，但是有同一个方法是Sing()，现在我们想用同一个函数：GetLyrics()来处理三个不同的类。怎么办呢？


```
type Person struct {
    Name string
    Sex string
    Telephone string
}

type Bird struct {
    Color string
    Size string
    CanFly bool
}

type Dog struct {
    Type string
    Description string	
}

func (this Person) Sing() string {
return this.Name + this.Sex + this.Telephone
}

func (this Bird) Sing() string {
return this.Color + this.Size
}

func (this Dog) Sing() string {
return this.Type + this.Description
}
```

如上，三个不同的结构体，然后我又同一个函数GetLyrics()，我想同时可以处理三个结构体，作为参数传给它。怎么办呢？
那就是Interface了：

```
	type AnimalCanSing interface {
		Sing()string
	}
```
这样，我们就定义了一个AnimalCanSing类型，这个类型的变量，可以存储所有实现了Sing()方法的对象（结构体）。
或者说，我们找到了一部分的结构体的共同特征，用来**定义了这一类的结构体**。
```
	func GetLyrics(obj AnimalCanSing) {
		fmt.Println(obj.Sing())
	}
```
上边这个方法，用interface做为参数，所有实现了Sing()方法的结构体，都可以作为参数传递给这个函数：
```
    Frank := Dog{}
    Jerry := Person{}
    Bob := Bird{}
    
    GetLyrics(Frank)
    GetLyrics(Jerry)
    GetLyrics(Bob)
```

就是这样，是不是很神奇？


# interface在Go语言的一些应用

空的interface（就是什么方法都不包含的interface），可以存储任意类型的值。有点类似于C语言的void *
``` 
var i interface{}
a := 5
s := "I am a string"
b := Bird{}

i = a
i = s
i = b
```

# 如何知道interface中存的是什么类型

interface可以存很多的类型，但是当我们想要知道它存的到底是哪个类型的时候应该怎么办呢？
那就是使用Comma-ok断言：

这个语法是Go语言的语法，可以直接判断是否是该类型的变量：
```
if _, ok := i.(int); ok {
    fmt.Println("i is int type")
}
```
就不仔细讲了。

interface其实很简单，也是很好玩的一个特性。