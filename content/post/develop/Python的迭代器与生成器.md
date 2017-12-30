+++
date = "2015-11-27T21:30:30+08:00"
draft = false
title = "python的迭代器与生成器"
Categories = ["Python大法"]
description = "网上介绍迭代器的文章，都用fibonacci数列举例子，我们也用这个举例子吧。"
menu = "python"
+++


## 从fibonacci数列说起

网上介绍迭代器的文章，都用fibonacci数列举例子，我们也用这个举例子吧。
我们先写一个简单的打印fibonacci数列的函数：

    def fibonacci(num):
        a, b, n = 0, 1, 0
        while n < num:
            print b
            a, b = b, a + b
            n += 1

这个方法，可以逐个打印指定个数的fibonacci数列。
如果想要在函数外获得整个fibonacci数列，我们怎么办呢？

## 获得整个fibonacci数列

我们可以这么搞：

    def fibonacci(num):
        a, b, n = 0, 1, 0
        fib_list = []
        while n < num:
            fib_list.append(b)
            a, b = b, a + b
            n += 1
        return fib_list

函数会接收所求数列的长度。返回响应长度的fibonacci数列。
相比于之前，只是把每一个计算出来的元素存入了一个list，最后返回。

可是，如果我们要求长度为1w或者1亿的fibonacci数列，我就需要在函数外一直等待着，等到把所有长度的都算完之后，一起返回，我甚至才能拿到整个数列中的第一个元素。

很明显，还有优化的空间。

## 如何优化 —— 对象

这个地方怎么优化呢？
很明显，最优的方案，就是计算机每算出一个值，我们可以实时的拿到这个值。
函数内明显是不行啦，因为我们要一次性返回嘛，哎~我们可以构造一个__对象__。
就像这样：

    class Fibonacci(object):
        def __init__(self, num):
            self.num = num
            self.a = 0
            self.b = 1
            self.n = 0

        def next(self):
            if self.n < self.num:
                self.a, self.b = self.b, self.a + self.b
                self.n += 1
                return self.a
            else:
                return -1

    if __name__ == "__main__":
        myObj = Fibonacci(10)
        x = myObj.next()
        while x != -1 :
            print x
            x = myObj.next()

这样我们可以实时拿到数列的元素，而不需要等待整个过程完成。
而且这样，空间利用率就变成了常数。

这样是不是就是完美的解决了呢？

## 迭代器

从算法上看，貌似是优化的差不多了。
但是语法上呢？使用起来是不是有些乱？在Python来看简直就是不能忍啊。
那么，能否像使用list一样的使用这个对象呢？比如这样：

    for x in Fibonacci(10):
        print x

如果能这样，岂不是美哉~

Python中，万物皆对象。那么能用for循环遍历的东西，肯定也是对象咯。
只是这种对象比较特殊，要有特殊的定义方法。
Python对此做出了规定：

- 必须包含____iter____()方法，该方法返回对象本身
- 必须包含next()方法，返回每次调用的结果

有了上述两点，定义出的类对象，就可以使用for循环来遍历啦。

可是这个循环总要有个终止的时候，难道每次都需要定义一个极限的值，然后在外层来在外层做判断吗？
当然不是！

Python为for循环封装了语法糖，当for循环遇到__StopIteration异常__的时候，就会停止，而不会将异常向上层传递。
因此，当循环需要结束的时候，我们只需要再next的方法里，抛出一个__StopIteration异常__就可以啦。

整个迭代器的实现代码就是这样：

    class Fibonacci(object):
        def __init__(self, num):
            self.num = num
            self.a = 0
            self.b = 1
            self.n = 0
    
        def __iter__(self):
            return self
    
        def next(self):
            if self.n < self.num:
                self.a, self.b = self.b, self.a + self.b
                self.n += 1
                return self.a
            else:
                raise StopIteration()
    

如此定义，我们就可以用如下的方式，很简单的获取到一个指定长度的fibonacci序列：

    for x in Fibonacci(100):
        print x


## 生成器

如果你以为这样就结束了，简直就是太小看这程序员这群人了。
每次做一个这种操作都要手动的定义一个对象吗？既然这种对象是特有的固定的，那么我能不能简化迭代器的定义方式呢？
答案是肯定的。那就是生成器——generator。

    def fibonacci_generator(max):
        a, b, n = 0, 1, 0
    
        while n < max:
            yield b
            a, b = b, a + b
            print n, max
            n = n + 1
            
        return
    

关键字__yield__将函数变成了一个generator，这个函数返回的将不再是普通的返回值，而是一个可迭代的对象。

在for循环执行时，每次都会去执行generator中的代码，执行到yield的时候，返回一个迭代值，然后函数停止执行，等待下一次调用。
下次迭代时，函数从上次的yield后边开始执行，直到再次遇到yield。
如果在执行过程中遇到return，就直接抛出StopIteration异常。

其实可以把整个for循环的过程开做是一次generator函数的调用。
更直白的说，就是:“__generator提供了一个可以在函数执行过程中取得执行上下文的方法__”


## 生成器续

之前说过，generator生成的，仍然是一个可迭代的对象，让我们回顾下迭代对象的特点：

- 必须包含____iter____()方法，该方法返回对象本身
- 必须包含next()方法，返回每次调用的结果

所以我们可以手动的调用next方法，来逐个获取generator的迭代值：


    f = fibonacci_generator(10)

    try:
        while True:
            print f.next()

    except StopIteration, e:
        pass


Python还是很好玩的哈~
