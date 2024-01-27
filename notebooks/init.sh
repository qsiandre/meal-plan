git config filter.strip-notebook-output.clean 'jupyter nbconvert --ClearOutputPreprocessor.enabled=True --to=notebook --stdin --stdout --log-level=ERROR'
# create .gitattributes in notebooks/
# add *.ipynb filter=strip-notebook-output  
# in .git/config new filter add 
# smudge = "cat"
# required
source /opt/homebrew/anaconda3/bin/activate
conda create --prefix ./env python=3.8      
pip3 install yapf
pip3 install jupyter_contrib_nbextensions
pip3 install notebook
pip3 install pandas