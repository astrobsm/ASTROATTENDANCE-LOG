-------------------------------------------------------------------

                           DigitalPersona
                        U.are.U SDK for Windows

                           Version 2.2.3
                          February 21 2014
				
      (c) 1996-2014 DigitalPersona, Inc. All Rights Reserved. 
-------------------------------------------------------------------

This document provides late-breaking or other information that supplements the DigitalPersona U.are.U SDK for Windows documentation.


-------------------------
How to Use This Document
-------------------------

To view the Readme file on-screen in Windows Notepad, maximize the Notepad window. On the Format menu, click Word Wrap. To print the Readme file, open it in Notepad or another word processor, and then use the Print command on the File menu.


---------
CONTENTS
---------

1.   INSTALLATION
2.   COMPATIBILITY
3.   SYSTEM REQUIREMENTS
4.   RELEASE NOTES
5.   KNOWN ISSUES
6.   SUPPORT AND FEEDBACK

 
----------------
1. INSTALLATION
----------------

You must have local administrator rights to install this product on supported Windows systems.

U.are.U SDK for Windows 2.2.3
1- Open/load the U.are.U SDK for Windows product package
2- Run SDK\x86\setup.ese OR SDK\x64\setup.exe located in the SDK folder
3- Follow the installation instructions
4- Connect the U.are.U Fingerprint Reader

-----------------
2. COMPATIBILITY
-----------------

DigitalPersona U.are.U SDK for Windows 2.2.3 is compatible with the following DigitalPersona products:

- DigitalPersona Pro for AD Workstation 5.5.0 and later
- DigitalPersona Pro for AD Kiosk 5.5.0 and later

Fingerprint templates produced by the U.are.U SDK for Windows are also compatible with the following DigitalPersona SDKs:

- Gold SDK
- Gold CE SDK
- One Touch for Windows SDK, all previous editions
- One Touch for Linux SDK, all distributions

Platinum SDK registration templates must be converted to a compatible format to work with these SDKs. See the Developer Guide for instructions on performing the conversion. 

DigitalPersona U.are.U SDK for Windows 2.2.3 is incompatible with any other DigitalPersona product.


-----------------------
3. SYSTEM REQUIREMENTS
-----------------------

- Microsoft Windows XP (32-bit), Microsoft Windows 7 (32/64-bit) or Microsoft Windows 8.1 (32/64-bit)
- CD/DVD drive (for CD-ROM installation)
- JRE or JDK (1.6 or 1.7) - To run samples and completed applications if developing in Java
- .NET Framework v2 or newer - To run samples and develop applications for .NET
- USB port on the computer where the fingerprint reader is to be connected
- If you connect a U.are.U 5xxx reader and it is not automatically detected when you run the sample application, be sure that you have Microsoft Visual C++ 2008 SP1 Redistributable or equivalent installed


-----------------
4. RELEASE NOTES
-----------------

4.1 This release supports the following API:

- C++
- .NET
- ActiveX
- Java

4.2 Adds U.are.U 5200 module support.

4.3 SDK and RTE cannot be installed on the sample computer.

4.4 ActiveX samples are excluded in this release.

4.5 The Image enhancement algorithm included.



------------------
5.   KNOWN ISSUES
------------------


5.1 tabclt32.ocx needs to be manually copied and registered if you are running the OPOS sample with RTE installation.

5.2 Path of jpos.properties needs to be set if you are running the JavaPos sample with RTE installation.

5.3 WSQ and NFIQ have been introduced into .NET wrappers. CSharp samples from previous release need to be rebuilt against new assemblies.



------------------------
6. SUPPORT AND FEEDBACK
------------------------

The latest version of documentation is available at http://www.digitalpersona.com/Support/Reference-Material/DigitalPersona-SDK-Reference-Material/

We provide fee-based support packages and support for registered users at our web site http://www.digitalpersona.com. 

Free technical support is available through the DigitalPersona Developer Connection forums at http://devportal.digitalpersona.com/index.php.

You can also purchase a Developer Support package at our web store: https://store2.esellerate.net/store/checkout/CustomLayout.aspx?s=STR1045285899&pc=&page=OnePageCatalog.htm

