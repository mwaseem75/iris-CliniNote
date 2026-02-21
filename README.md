<img src="https://community.intersystems.com/sites/default/files/inline/images/archived.gif" width=100></img>
<b>&nbsp;no maintenance or update</b> 

# Vector-inside-IRIS
This is an attempt to run a vector search demo completely in IRIS    
There are no external tools and all you need is a Terminal / Console and the management portal.  
Special thanks to [Alvin Ryanputra](https://community.intersystems.com/user/alvin-ryanputra)
as his package [iris-vector-search](https://openexchange.intersystems.com/package/iris-vector-search) that was the base   
of inspiration and the source for test data.   
My package is based on IRIS 2024.1 release and requires attention to your processor capabilities.   

I attempted to write the demo in pure ObjectScript.   
Only the calculation of the description_vectoris is done in embedded Python.   
Calculation of a vector with 384 dimensions over 2247 records takes time.   
In my Docker container, it was running  01:53:14 to generate them completely.      
So I adjusted this step to be reentrant to allow pausing generation.     
Every 50 records you get an offer to have a stop.

Any suggestions for enhancements are very welcome,

### Prerequisites
Make sure you have [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker desktop](https://www.docker.com/products/docker-desktop) installed.
### Installation
Clone/git pull the repo into any local directory
```
$ git clone https://github.com/rcemper/Vector-inside-IRIS.git
```
To build and start the container run:
```
$ docker compose up -d && docker compose logs -f
```
To open IRIS Terminal do:
```
$ docker-compose exec iris iris session iris
USER>
```
or using **iTerm**
```
http://localhost:42773/iterm/
```
To access IRIS System Management Portal
```
http://localhost:42773/csp/sys/UtilHome.csp
```
### How to use it
From terminal just start   
```
USER>do ^A.DemoV

     Test Vector Search
=============================
     1 - Initialize Tables
     2 - Generate Data
     3 - VECTOR_COSINE
     4 - VECTOR_DOT_PRODUCT
     5 - Create Scotch
     6 - Load Scotch.csv
     7 - generate VECTORs
     8 - VECTOR search
Select Function or * to exit : 8

     Default search:
Let's look for a scotch that costs less than $100,
 and has an earthy and creamy taste
     change price limit [100]: 50
     change phrase [earthy and creamy taste]: earthy

calculating search vector

     Total below $50: 222

ID      price   name
1990    40      Wemyss Vintage Malts 'The Peat Chimney,' 8 year old, 40%
1785    39      The Famous Jubilee, 40%
1868    40      Tomatin, 15 year old, 43%
2038    45      Glen Grant, 10 year old, 43%
1733    29      Isle of Skye, 8 year old, 43%

5 Rows(s) Affected
```
You see the basic functionalities of Vectors in steps 1..4   
Steps 5..8 are related to the search example I borrowed from Alvin     
Step 6 (import of test data) is straight ObjectScript       
SQL LOAD DATA was far too sensible for irregularities in the input CSV  

I suggest following the examples also in MGMT portal to watch how Vectors operate.

[Article in DC](https://community.intersystems.com/post/vector-inside-iris)

[GitHub](https://github.com/rcemper/Vector-inside-IRIS)
