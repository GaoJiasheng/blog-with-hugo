all: build

build:
	rm -rf ./public/*
	hugo -d ./public/ --buildDrafts

install:
	rm -rf ../blog-online/*
	cp -rf ./public/* ../blog-online/
