import pandas as pd
df = pd.read_excel("Synthetic_Data.xlsx")
print(df['component'].value_counts())
print(df['node_type'].value_counts())
print(df[df['parent_metric_id'].isna()][['metric_id','short_name','component','weight']].to_string())