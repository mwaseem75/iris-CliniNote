ARG IMAGE=intersystemsdc/iris-community
FROM $IMAGE
USER root
WORKDIR /home/irisowner/dev  
RUN chown ${ISC_PACKAGE_MGRUSER}:${ISC_PACKAGE_IRISGROUP} /home/irisowner/dev
USER ${ISC_PACKAGE_MGRUSER}

COPY src src
COPY module.xml module.xml
COPY iris.script iris.script

#RUN python3 -m pip install --target /usr/irissys/mgr/python sentence_transformers
RUN python3 -m pip install --no-cache-dir --target /usr/irissys/mgr/python "sentence-transformers==3.1.0" "numpy<2.0"

RUN iris start IRIS && iris session IRIS < iris.script && iris stop IRIS quietly 