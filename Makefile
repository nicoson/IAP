
Deploy:
	docker build -t iap .
	
	# push to avatest
	# docker login reg.qiniu.com -u avatest@qiniu.com -p 25da897892c334ffd6187899a306c14959ae5c0d4552db8da0eb3cbb1e74299a
	# docker tag wa-sh reg.qiniu.com/avatest/wa-sh:v4.5
	# docker push reg.qiniu.com/avatest/wa-sh:v4.5

	# push to goverment 此处拼错，将错就错
	docker login reg.qiniu.com -u gr@qiniu.com -p '7Niu!@#$$'
	docker tag iap reg.qiniu.com/goverment/iap:v1.0
	docker push reg.qiniu.com/goverment/iap:v1.0