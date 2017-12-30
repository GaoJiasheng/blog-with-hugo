all: build

run:
	hugo server --buildDrafts

build:
	rm -rf ./public/*
	hugo -d ./public/ --buildDrafts

install:
	rm -rf ../blog-online/*
	cp -rf ./public/* ../blog-online/
	cp ./scripts/blog-online-Makefile ../blog-online/Makefile
	cd ../blog-online/ && git add . && git commit -m "modify" && git push origin coding-pages
