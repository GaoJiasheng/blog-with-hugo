all: build

run:
	hugo server --buildDrafts --port=1313 --bind=0.0.0.0

clean:
	rm -rf ./public/*

build:
	make clean
	hugo -d ./public/ --buildDrafts

install:
	rm -rf ../blog-public/*
	cp -rf ./public/* ../blog-public/
	cp ./scripts/blog-online-Makefile ../blog-public/Makefile
	cd ../blog-public/ && git add . && git commit -m "modify" && git push origin master
