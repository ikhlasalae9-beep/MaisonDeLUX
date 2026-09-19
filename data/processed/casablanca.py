from selenium import webdriver 
from selenium.webdriver.common.by import By 
from selenium.webdriver.support.ui import WebDriverWait 
from selenium.webdriver.support import expected_conditions as EC 
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException
from selenium.webdriver.chrome.service import Service 
from webdriver_manager.chrome import ChromeDriverManager
import numpy as np
import pandas as pd
import time

'''
This script scrapes the mubawab website starting from the properties for sale page. 
It gets to the listing page through city selection page, district selection page and 
when the district is large enough it also goes through the neighbourhood selection page to 
finally land on the listings pages and start scraping listing by listing and page by page.
'''

def on_listings_page(browser):
    '''
    Check if the browser is on a page with property listings on the mubawab website
    '''
    try:
        WebDriverWait(browser, 5).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'listingBox')]"))
        )
        return True
    except TimeoutException:
        return False

def get_listing(browser,ard,qrt=None,n=0):
    '''
    This function gets the info of the n'th listing on a listings page and goes back to that page
    '''
    listing = browser.find_element(By.XPATH, f"(//*[contains(@class, 'listingBox')])[{n+1}]")
    browser.execute_script("arguments[0].click();", listing)
    
    # N3tiw l'page wa9t sghir bach t-chargi l'informations dyal l'annonce
    time.sleep(1.5)

    try:
        title = browser.find_element(By.XPATH, '//h1').text
    except:
        title = np.nan
        
    try:
        # L'type dyal l'immobilier ghaliban kaykon howa l'klma l'wla f l'titre f Mubawab (Appartement, Villa...)
        type_ = title.split()[0] if isinstance(title, str) else np.nan
    except:
        type_ = np.nan
        
    try:
        # L'prix kaykon fih "DH"
        price = browser.find_element(By.XPATH, '//*[contains(text(), "DH")]').text
    except:
        price = np.nan

    try:
        # L'localisation katkon ghaliban ta7t l'h1
        loca = browser.find_element(By.XPATH, '//h1/following-sibling::*[1]').text
    except:
        loca = np.nan

    try:
        # Njbdo Latitude w Longitude bla ma n-cliquiw 3la l'carte bach ntfadaw l'erreurs
        coord = browser.find_element(By.XPATH, '//*[@lat and @lon]')
        lat = coord.get_attribute("lat")
        lon = coord.get_attribute("lon")
    except:
        lat = np.nan
        lon = np.nan

    try:
        # Les tags w caractéristiques (chambres, piscines...)
        tags = browser.find_elements(By.XPATH, '//*[contains(@class, "feature") or contains(@class, "tag")]')
        other_tags = [tag.text for tag in tags if tag.text.strip() != '']
        if not other_tags:
            other_tags = np.nan
    except:
        other_tags = np.nan

    ls = [ard,qrt,type_,loca,lat,lon,title,price,other_tags]
    print(f"      --> Titre: {title} | Prix: {price}")
    
    browser.back()
    return ls

def get_listings_pages(browser, ard, qrt = None, n_pages = None):
    '''
    This functions runs through all the pages of listings and returns an array with the listings informations
    '''
    listings_info = []
    
    if not on_listings_page(browser):
        print(f'    -> Ma kayninch annonces hna (awla l\'page t9ila). Skipped.')
        return listings_info
    else:
        n_pages_avl = len(browser.find_elements(By.CLASS_NAME, 'Dots'))
        if n_pages is None:
            last_page = False
            i=1 
            while not last_page:
                n_listings = len(browser.find_elements(By.XPATH, "//*[contains(@class, 'listingBox')]"))
                print(f'    should get {n_listings} listings from page {i}') 
                for n in range(n_listings):
                    ls = get_listing(browser,ard=ard,qrt=qrt,n=n)
                    listings_info.append(ls)
                    
                try:
                    arrows = browser.find_elements(By.CLASS_NAME, 'arrowDot')
                    arrows[1].click()  
                    i+=1 
                except: 
                    last_page = True
            return listings_info
    
        else:
            if (n_pages > n_pages_avl) or (not isinstance(n_pages,int)) or (n_pages<=0):
                print(f'    n_pages must be positive integer smaller or equal to the number of pages, in this case {n_pages_avl}')
                n_pages = n_pages_avl
            for i in range(n_pages):
                n_listings = len(browser.find_elements(By.XPATH, "//*[contains(@class, 'listingBox')]"))
                print(f'should get {n_listings} listings form page {i}') 
                for n in range(n_listings):
                    ls = get_listing(browser,ard=ard,qrt=qrt,n=n)
                    listings_info.append(ls)
                try:
                    arrows = browser.find_elements(By.CLASS_NAME, 'arrowDot')
                    arrows[1].click()   
                except: 
                    last_page = True
            return listings_info

def get_city_listings(browser,city,n_pages=None):
    '''
    This function return a dataframe with all the relevant property listings info scraped for a selected city
    '''
    if not(isinstance(city,str)):
        raise TypeError('city must be of type string')
    else:
        all_data = []
        url = 'https://www.mubawab.ma/fr/mp/immobilier-a-vendre'
        browser.get(url)
        
        timeout = 20
        try:
            WebDriverWait(browser, timeout).until(EC.visibility_of_element_located((By.XPATH, "//div[@class='na-map']")))
        except TimeoutException:
            print("Timed out waiting for page to load")
            browser.quit()
            
        city = city.lower()
        city_buttons = browser.find_elements(By.XPATH, '//*[@id="top-villes"]/div/div/button')
        for button in city_buttons:
            if button.text.lower() == city.lower():
                click = button
        try:
            click.click()
        except:
            print(f'{city} not in top cities')
    
    timeout = 10
    try:
        WebDriverWait(browser, timeout).until(EC.visibility_of_element_located((By.XPATH, "//div[@class='na-map']")))
    except TimeoutException:
        print("Timed out waiting for district page to load")
        browser.quit()
    
    url_ard = browser.current_url 
    n_arrondissements = len(browser.find_elements(By.XPATH, '/html/body/section/div[2]/div[1]/div[2]/ul/li')) 
    
    for n in range(1,n_arrondissements+1):
        arrondissement = browser.find_element(By.XPATH, f'/html/body/section/div[2]/div[1]/div[2]/ul/li[{n}]/a') 
        ard_text = arrondissement.text 
        browser.execute_script("arguments[0].click();", arrondissement) 
        
        if on_listings_page(browser): 
            print(f'getting listings for {ard_text}') 
            all_data.append(get_listings_pages(browser, ard=ard_text,n_pages = n_pages)) 
            browser.get(url_ard) 
        else:
            url_qrt = browser.current_url 
            n_quartiers = len(browser.find_elements(By.XPATH, '/html/body/section/div[2]/div[1]/div[2]/ul/li')) 
            for nq in range(1,n_quartiers+1):
                quartier = browser.find_element(By.XPATH, f'/html/body/section/div[2]/div[1]/div[2]/ul/li[{nq}]/a') 
                qrt_text = quartier.text 
                browser.execute_script("arguments[0].click();", quartier)
                print(f'getting listings for {ard_text}, {qrt_text}') 
                all_data.append(get_listings_pages(browser,ard = ard_text, qrt= qrt_text,n_pages = n_pages)) 
                browser.get(url_qrt) 
            browser.get(url_ard) 
    
    df = pd.concat([pd.DataFrame(lst) for lst in all_data if lst]).reset_index(drop = True)
    df.columns = ['District','Neighbourhood','Type','Localisation','Latitude','Longitude','Title','Price','Tags']
    return df

#create a new instance of Chrome
option = webdriver.ChromeOptions()
option.add_argument(" — incognito")

service = Service(ChromeDriverManager().install()) 
browser = webdriver.Chrome(service=service, options=option)

df = get_city_listings(browser,'Casablanca',n_pages = 1)
df.to_csv('mubawab_listings_ard_qrt.csv',index=False)