all: build

run:
	hugo server --buildDrafts --port=1313 --bind=0.0.0.0

clean:
	rm -rf ./public/*

build:
	make clean
	hugo -d ./public/ --buildDrafts

install:
	rm -rf ../blog-online/*
	cp -rf ./public/* ../blog-online/
	cp ./scripts/blog-online-Makefile ../blog-online/Makefile
	cd ../blog-online/ && git add . && git commit -m "modify" && git push origin coding-pages
