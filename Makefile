
Deploy:
	docker build -t wa-sh .
	
	# push to avatest
	docker tag wa-sh reg.qiniu.com/avatest/wa-sh:v1.6
	docker push reg.qiniu.com/avatest/wa-sh:v1.6
